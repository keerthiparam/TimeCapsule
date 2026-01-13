# TimeCapsule `( ◡̀_◡́)ᕤ`

> **Preserve Digital Evidence. Prove It Existed.**
> The decentralized digital notary for the web.

## `( o_O )?` The Problem
The internet is fragile. News articles are stealth-edited, tweets are deleted, and evidence vanishes behind "404 Not Found" errors.
*   **Link Rot:** 25% of deep-web links die within years.
*   **Censorship:** Centralized archives can be forced to take down content. 
*   **Tampering:** Screenshots can be Photoshopped. 

## `(≧∇≦)ﾉ` The Solution
**TimeCapsule** is a forensic archiving tool that freezes the truth forever.
1.  **Capture:** We use a server-side browser to take a forensic snapshot of the DOM.
2.  **Store:** We upload the content to **IPFS**, so it can never be deleted. 
3.  **Timestamp:** We anchor the SHA-256 hash to the **Bitcoin Blockchain** via OpenTimestamps.

**Result?** An immutable, verifiable record that holds up in court. 

---

## Key Features

*   **Forensic Web Capture:** Captures HTML, Metadata, and Screenshots via Puppeteer. 
*   **File Uploads:** Drag & drop PDFs, Images, or Text to timestamp them instantly. 
*   **Blockchain Proof:** Automatically generates an `.ots` receipt anchored to Bitcoin. 
*   **Web3 Login:** Sign in securely with **MetaMask**. `( 🦊 )`
*   **Public/Private Toggles:** Keep your vault private or become a whistleblower on the Global Feed. 
*   **PDF Reports:** Generate professional "Chain of Custody" reports for legal use. 

---

## Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15 + Tailwind | The shiny UI |
| **Auth** | Supabase + MetaMask | Identity & Sessions |
| **Backend** | Next.js API Routes | Serverless Functions |
| **Engine** | Puppeteer | Headless Browser Capture |
| **Storage** | IPFS (Storacha/Web3.storage) | Decentralized Vault |
| **Trust** | OpenTimestamps | Bitcoin Anchoring |
| **Database** | PostgreSQL (Prisma) | Metadata Indexing |

---

## Getting Started

Coming Soon (ง •̀_•́)ง

## Architecture

![alt text](<architecture.png>)
---

## How to Verify Evidence

Don't trust us? Verify it yourself! `( ಠ_ಠ )`

1.  Go to the **Verify Page** of any capture.
2.  Download the **Evidence File** (from IPFS) and the **Proof File** (`.ots`).
3.  Go to [OpenTimestamps.org](https://opentimestamps.org).
4.  Upload both files.
5.  **Success!** You will see the Bitcoin Block height where your data is anchored.

---

**Built with ❤️ by Team Web Wizards**
