# Legacy — Streamlit prototype

The original CryptoRadar dashboard: a single-file Python + Streamlit app that fetched coin data from CoinGecko and rendered a static Matplotlib radar chart.

Kept here as a reference point for the Next.js rewrite at the repo root.

## Running it

```bash
pip install -r requirements.txt
streamlit run CryptoRadar.py
```

## Why we rewrote it

- CoinGecko was called directly from the browser session, so rate-limit errors leaked to users.
- The Matplotlib chart was static — no hover, no zoom, no axis interaction.
- Streamlit's layout collapsed poorly on mobile.
- Feature surface was thin (one view, no coin detail, no history, no export, no methodology page).

See the root [README.md](../README.md) for the new architecture.

---

## Original description (preserved)

Interactive Crypto Radar Dashboard | Python, Streamlit, API

- Built a responsive data visualization web application using Python, Streamlit, and Matplotlib to track and compare cryptocurrency market data.
- Integrated the CoinGecko RESTful API to fetch real-time market data, utilizing multi-select parameters and dynamic endpoints based on user-selected categories.
- Optimized application performance and managed strict API rate limits by implementing `@st.cache_data` (TTL), reducing redundant network requests by over 80% during user interactions.
