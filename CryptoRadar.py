import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
import requests

st.set_page_config(page_title="Crypto Radar Dashboard", layout="wide")
st.title("Crypto Radar Dashboard - CoinGecko API Integration")

# 1. Define criteria and Min-Max values
criteria = [
    "Market_Cap", "Volume_24h", "Liquidity_Ratio", "Tokenomics_Health",
    "Momentum_7D", "Momentum_30D", "ATH_Recovery"
]

min_max = {
    "Market_Cap": (10_000_000, 1_000_000_000_000),
    "Volume_24h": (1_000_000, 50_000_000_000),
    "Liquidity_Ratio": (0.01, 0.50),
    "Tokenomics_Health": (0.1, 1.0),
    "Momentum_7D": (-30.0, 50.0),
    "Momentum_30D": (-50.0, 100.0),
    "ATH_Recovery": (-100.0, 0.0),
}


def normalize(value, min_val, max_val):
    if value is None:
        return 0.0
    norm = (value - min_val) / (max_val - min_val)
    return max(0.0, min(1.0, norm))

# --- NEW FEATURES: Dynamic Categories and Coin Lists ---

# Fetch all available categories from CoinGecko (Cached for 24 hours to save API calls)


@st.cache_data(ttl=86400)
def fetch_categories():
    url = "https://api.coingecko.com/api/v3/coins/categories/list"
    response = requests.get(url)
    if response.status_code == 200:
        categories = response.json()
        # Create a dictionary of { "Category Name": "category_id" }
        return {cat['name']: cat['category_id'] for cat in categories}
    return {}

# Fetch top coins based on selected category (Cached for 1 hour)


@st.cache_data(ttl=3600)
def fetch_available_coins(category_id=None):
    # Fetch top 100 coins by market cap
    url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1"
    if category_id:
        url += f"&category={category_id}"

    response = requests.get(url)
    if response.status_code == 200:
        coins = response.json()
        # Create a dictionary of { "Bitcoin (BTC)": "bitcoin" } for better UI
        return {f"{c['name']} ({c['symbol'].upper()})": c['id'] for c in coins}
    return {}

# --- ORIGINAL FEATURE: Fetch detailed data for selected coins ---


@st.cache_data(ttl=3600)
def fetch_crypto_data(coin_ids):
    if not coin_ids:
        return {}
    ids_string = ",".join(coin_ids)
    url = f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids={ids_string}&price_change_percentage=7d,30d"

    response = requests.get(url)
    if response.status_code == 200:
        raw_data = response.json()
        processed_data = {}
        for data in raw_data:
            mcap = data.get("market_cap") or 0
            vol = data.get("total_volume") or 0
            fdv = data.get("fully_diluted_valuation") or mcap

            processed_data[data["name"]] = {
                "Market_Cap": mcap,
                "Volume_24h": vol,
                "Liquidity_Ratio": (vol / mcap) if mcap > 0 else 0,
                "Tokenomics_Health": (mcap / fdv) if fdv > 0 else 1.0,
                "Momentum_7D": data.get("price_change_percentage_7d_in_currency") or 0,
                "Momentum_30D": data.get("price_change_percentage_30d_in_currency") or 0,
                "ATH_Recovery": data.get("ath_change_percentage") or -100.0
            }
        return processed_data
    return {}


# --- SIDEBAR UI ---
st.sidebar.header("Filter & Select")

# 1. Category Filter
category_dict = fetch_categories()
cat_options = ["All Coins (Top 100)"] + list(category_dict.keys())
selected_category_name = st.sidebar.selectbox(
    "1. Select Category", options=cat_options)

# Get the actual category ID to send to the API
if selected_category_name == "All Coins (Top 100)":
    category_id = None
else:
    category_id = category_dict[selected_category_name]

# 2. Dynamic Coin Selection
with st.spinner("Loading coins..."):
    available_coins = fetch_available_coins(category_id)

if not available_coins:
    st.sidebar.error("Could not fetch coins. API limit might be reached.")
else:
    selected_names = st.sidebar.multiselect(
        "2. Choose coins to compare",
        options=list(available_coins.keys()),
        max_selections=5,  # Limit to 5 coins to keep chart readable
        placeholder="Select up to 5 coins"
    )

    # --- PLOTTING LOGIC ---
    if selected_names:
        selected_ids = [available_coins[name] for name in selected_names]

        with st.spinner("Fetching detailed metrics..."):
            api_data = fetch_crypto_data(selected_ids)

        if api_data:
            data, names = [], []

            for name, stats in api_data.items():

                norm_values = []

                for c in criteria:
                    val = stats[c]
                    min_val = min_max[c][0]
                    max_val = min_max[c][1]
                    norm_values.append(normalize(val, min_val, max_val))

                data.append(norm_values)
                names.append(name)

            num_vars = len(criteria)
            angles = np.linspace(0, 2 * np.pi, num_vars,
                                 endpoint=False).tolist()
            angles += angles[:1]

            fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))

            for i, d in enumerate(data):
                values = d + d[:1]
                ax.plot(angles, values, linewidth=2, label=names[i])
                ax.fill(angles, values, alpha=0.15)

            ax.set_xticks(angles[:-1])
            ax.set_xticklabels([c.replace("_", " ")
                               for c in criteria], fontsize=9)
            ax.tick_params(axis='x', pad=20)
            ax.set_yticks([0.2, 0.4, 0.6, 0.8, 1.0])
            ax.set_yticklabels(["20%", "40%", "60%", "80%",
                               "100%"], color="grey", size=8)
            ax.set_ylim(0, 1)

            ax.set_title(
                f"Radar Comparison ({selected_category_name})", size=14, y=1.1)
            ax.legend(loc='upper right', bbox_to_anchor=(
                1.3, 1.1), fontsize=10)
            plt.tight_layout()

            st.pyplot(fig)
        # Add an else block to handle API failures or rate limits
        else:
            st.error("⏳ **API Rate Limit Reached**: You are making requests too frequently. Please wait 1-2 minutes and try selecting the coins again. (This is a limitation of the CoinGecko Free API)")
    else:
        st.info("👈 Please select cryptocurrencies from the sidebar to view the chart.")
