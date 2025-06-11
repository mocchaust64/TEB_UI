# TokenUI - Solana Token Manager

TokenUI is a modern user interface for creating, managing, and interacting with tokens on the Solana blockchain, focusing on Token-2022 extension features.

**Live Demo:** [https://tokenextensions.vercel.app/](https://tokenextensions.vercel.app/)

![TokenUI Demo](public/token-preview.png)

## About This Project

TokenUI is built on top of our custom [token-extensions-boost](https://github.com/mocchaust64/token-extensions-boost) SDK, which simplifies working with Solana Token-2022 extensions. This SDK provides a comprehensive, developer-friendly interface for creating and managing tokens with advanced features like transfer fees, non-transferable tokens, and metadata extensions.

The combination of our simplified SDK and intuitive UI makes TokenUI one of the most accessible tools for working with Solana's next-generation token features, allowing both developers and non-technical users to leverage the full power of Token-2022.

## Features

- 🪙 **Create Tokens** - Create new tokens with customized metadata and extensions
- 🔍 **View Tokens** - Display list of tokens in your wallet and detailed information
- 🔄 **Manage Tokens** - Mint more tokens, burn tokens, freeze and thaw accounts
- 🛠️ **Extension Support** - Support for Token-2022 extensions such as:
  - Transfer Fee
  - Non-Transferable
  - Permanent Delegate
  - Default Account State
  - Interest Bearing
  - Transfer Hook
  - And many more...

## Installation

```bash
# Clone repository
git clone https://github.com/yourusername/TokenUI.git
cd TokenUI

# Install dependencies
npm install
# or
pnpm install

# Run development environment
npm run dev
# or
pnpm dev
```

## Configuration

Create a `.env.local` file with the following information:

```
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
```

## Usage

1. Connect your Solana wallet (Phantom, Solflare, etc.)
2. Choose the function you want to use from the main menu
3. To create a token:
   - Fill in basic information (name, symbol, decimals, etc.)
   - Select the extensions you want to add
   - Configure options for each extension
   - Create the token with metadata and selected features

## Project Structure

- `app/` - Application pages and components (Next.js App Router)
- `components/` - Reusable UI components
- `lib/` - Libraries, services, and utilities
  - `services/` - Blockchain interaction services
  - `utils/` - Utilities
- `hooks/` - Custom React hooks
- `public/` - Static resources
- `styles/` - CSS and Tailwind configuration

## Technologies

- Next.js 15+
- React 19
- TypeScript
- Tailwind CSS
- Solana Web3.js
- SPL Token (Token-2022)
- [token-extensions-boost](https://github.com/mocchaust64/token-extensions-boost) - Our custom SDK for Solana Token Extensions

## The SDK: token-extensions-boost

The TokenUI project is powered by our [token-extensions-boost](https://github.com/mocchaust64/token-extensions-boost) SDK, which provides:

- **Instructions-first API** - Seamless wallet integration without private key exposure
- **Fluent builder pattern** - Intuitive creation of tokens with multiple extensions
- **Comprehensive extension support** - Implements all major Token-2022 extensions
- **TypeScript support** - Full type definitions for improved developer experience
- **Simplified account management** - Easy creation and management of token accounts

This SDK abstracts away the complexity of working with Solana Token Extensions, allowing developers to focus on building great applications instead of dealing with low-level blockchain interactions.

## Contributing

Contributions are always welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

If you have any questions or suggestions, please open an issue or contact via email.
