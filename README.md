# NyaySutra Vault 🏛️

A secure, blockchain-integrated digital evidence management system for courts of law. Built with React, Supabase, and IPFS.

## 🚀 Quick Start (5 minutes)

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Configure Environment**
Copy `.env` file contents (already configured with Supabase keys):
```env
VITE_SUPABASE_URL=https://swpmfobqpsymnfwqcknb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci... (already set)
```

**Optional - for IPFS uploads:**
```env
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_PINATA_API_KEY=your_pinata_key
VITE_PINATA_SECRET_KEY=your_pinata_secret
```

### 3. **Start Development Server**
```bash
npm run dev
```
Open `http://localhost:8080`

### 4. **Build for Production**
```bash
npm run build
npm run preview
```

---

## 🎯 Features

### ✅ Role-Based Access Control
- **Judges** - Seal evidence, manage sessions, approve uploads
- **Clerks** - Track cases, manage documents
- **Observers** - View public case information

### ✅ Secure Evidence Management
- **Client-side hashing** (SHA-256)
- **IPFS storage** with Pinata integration
- **Chain of custody tracking** - immutable logs
- **Digital signatures** - blockchain verification
- **Evidence sealing** - prevent tampering

### ✅ Court Session Management
- Start/end live sessions
- Grant/deny permission requests
- Real-time participant notifications
- Judicial notepad for session notes

### ✅ Glassmorphism UI
- Dark mode with gradient effects
- Smooth animations (Framer Motion)
- Responsive design (mobile to desktop)
- Role-specific color themes

---

## 📁 Project Structure

```
src/
├── pages/              # Route pages (Courts, Cases, Dashboard)
├── components/         # Reusable components
│   ├── dashboard/     # Role-based dashboards
│   ├── cases/         # Case management components
│   ├── layout/        # Layout wrappers (Glass effects)
│   └── ui/            # shadcn/ui components
├── contexts/          # Global state (Auth, Role, Web3)
├── hooks/             # Custom hooks (useSecureUpload, useEvidenceSealing)
├── services/          # Business logic (IPFS, case operations)
├── integrations/      # External services (Supabase)
└── types/             # TypeScript type definitions
```

---

## 🔧 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + Framer Motion |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | IPFS (Pinata) + Supabase Storage |
| **State** | React Context + TanStack Query |
| **Web3** | wagmi + viem (optional) |
| **Forms** | React Hook Form + Zod |

---

## 🔐 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **JWT Authentication** - Secure session management
- **Evidence Immutability** - Once sealed, cannot be modified
- **Chain of Custody** - Complete audit trail
- **Digital Signatures** - Blockchain verification (optional)
- **File Encryption** - Client-side hashing before upload

---

## 📖 Documentation

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - What's built, features, next steps
- **[TECHNOLOGY_AND_WORKFLOW_DOCUMENTATION.md](TECHNOLOGY_AND_WORKFLOW_DOCUMENTATION.md)** - Deep technical details, data flows, workflows

---

## 🧪 Testing

### Development
```bash
npm run dev         # Start dev server
npm run lint        # Run ESLint
npm run build       # Build for production
npm run preview     # Preview production build
```

### Test Workflow
1. Sign up with a test email
2. Select your role (Judge/Clerk/Observer)
3. Create a court and section
4. Create a case
5. Upload evidence (uses mock IPFS if keys not configured)
6. Seal evidence (digital signature)
7. View in Evidence Vault

---

## ⚙️ Configuration

### Environment Variables
```env
# Supabase (Required)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# IPFS/Pinata (Optional - falls back to mock)
VITE_IPFS_GATEWAY=
VITE_PINATA_API_KEY=
VITE_PINATA_SECRET_KEY=

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=
VITE_SENTRY_DSN=
```

### Smart Contract Integration
To enable blockchain recording:
1. Deploy evidence registry contract
2. Update contract addresses in:
   - `src/hooks/useSecureUpload.ts` - `recordOnBlockchain()`
   - `src/hooks/useEvidenceSealing.ts` - `recordSealOnBlockchain()`

---

## 🚧 Work in Progress

- [ ] Smart contract integration (Ethereum/Polygon)
- [ ] Advanced case analytics
- [ ] Video evidence support
- [ ] Multi-language support
- [ ] Mobile app (React Native)

---

## 📝 Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Routing & providers setup |
| `src/contexts/RoleContext.tsx` | Role-based permissions |
| `src/contexts/Web3Context.tsx` | Wallet connection |
| `src/pages/Dashboard.tsx` | Role switcher |
| `src/hooks/useSecureUpload.ts` | Secure file uploads |
| `src/hooks/useEvidenceSealing.ts` | Digital signatures |
| `src/services/ipfsService.ts` | IPFS integration |

---

## 🤝 Support

For issues, questions, or contributions:
1. Check **IMPLEMENTATION_SUMMARY.md** for status
2. Review **TECHNOLOGY_AND_WORKFLOW_DOCUMENTATION.md** for technical details
3. Open an issue on GitHub

---

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for the Indian Justice System**

*Last Updated: January 9, 2026*

