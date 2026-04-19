# Crypto Radar Dashboard

![Python](https://img.shields.io/badge/Python-3.8%2B-blue?style=flat&logo=python&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-Framework-FF4B4B?style=flat&logo=streamlit&logoColor=white)
![CoinGecko API](https://img.shields.io/badge/Data-CoinGecko%20API-8DC63F?style=flat)

An interactive web application built with **Python** and **Streamlit** that visualizes and compares the fundamental and momentum metrics of cryptocurrencies using dynamic Radar Charts. 

🔗 **[View Live Application Here]([https://your-app-url-here.streamlit.app/](https://crypto-radar-dashboard.streamlit.app/))** 

---

## Features

- **Real-Time Data Fetching:** Integrates with the CoinGecko REST API to pull live market data.
- **Dynamic Category Filtering:** Utilizes a 2-step dynamic fetching system to load available categories (e.g., Layer-1, DeFi, AI) and subsequently fetch the top 100 coins within that specific sector.
- **Data Normalization:** Employs a Min-Max scaling algorithm to convert vastly different data ranges onto a unified 0-1 scale for visual comparison.
- **Custom Financial Indicators:** Calculates unique metrics such as *Liquidity Ratio* and *Tokenomics Health* to provide deeper analytical insights beyond standard API data.

---

## Understanding the Metrics

How the key metrics are calculated:

* **Market Cap:** The total market value of a cryptocurrency's circulating supply.
* **Volume 24h:** A measure of how much of a cryptocurrency was traded in the last 24 hours.
* **Liquidity Ratio (`Volume / Market Cap`):** Measures market activity and liquidity depth. A higher ratio indicates a highly active and easily tradable asset.
* **Tokenomics Health (`Market Cap / FDV`):** Assesses inflation risk. A value closer to 1.0 (100%) means most tokens are already in circulation, reducing the risk of sudden supply dumps.
* **Momentum (7D & 30D):** The percentage change in price over the last 7 and 30 days to identify short-term and mid-term trends.
* **ATH Recovery:** How far the current price is from its All-Time High. 

---

## Technologies Used

- **Language:** Python
- **Frontend Framework:** Streamlit
- **Data Visualization:** Matplotlib, NumPy

---
