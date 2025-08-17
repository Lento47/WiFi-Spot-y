# WiFi Costa Rica - Wallet Pass Generation Server

This backend server generates digital wallet passes for Apple Wallet, Google Pay, Samsung Pay, and other wallet applications.

## Features

- **Apple Wallet (.pkpass)**: Generates signed .pkpass files with proper MIME type
- **Google Pay**: Creates loyalty card JSON structures
- **Samsung Pay**: Generates Samsung Pay compatible passes
- **Generic Wallets**: Provides universal wallet pass formats
- **Real-time Generation**: Creates passes on-demand with user data
- **Proper MIME Types**: Serves .pkpass files with correct headers

## Prerequisites

- Node.js 16+ 
- Apple Developer Account (for Apple Wallet)
- PassKit certificates (.p12 files)
- WWDR certificate

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up certificates:**
   - Place your Apple Pass certificate in `certs/pass.p12`
   - Place WWDR certificate in `certs/wwdr.p12`
   - Set environment variable: `PASS_CERT_PASSWORD=your_cert_password`

3. **Create pass template:**
   - Ensure `models/Generic.pass/pass.json` exists
   - Customize the template for your needs

## Configuration

### Environment Variables

```bash
PORT=3001                                    # Server port
PASS_CERT_PASSWORD=your_password            # Apple certificate password
NODE_ENV=development                        # Environment mode
```

### Pass Template Structure

The `models/Generic.pass/` directory should contain:
- `pass.json` - Main pass configuration
- `icon.png` - Pass icon (29x29px)
- `icon@2x.png` - Retina icon (58x58px)
- `logo.png` - Logo image
- `strip.png` - Strip image

## Usage

### Start the server:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### API Endpoints

#### Generate Apple Wallet Pass
```http
POST /api/wallet/apple-pass
Content-Type: application/json

{
  "userId": "user123",
  "userEmail": "user@example.com",
  "credits": {
    "hours": 2,
    "minutes": 30
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Apple Wallet pass generated successfully",
  "passUrl": "http://localhost:3001/passes/wifi-card-user123-1234567890.pkpass",
  "filename": "wifi-card-user123-1234567890.pkpass"
}
```

#### Generate Google Pay Pass
```http
POST /api/wallet/google-pay
Content-Type: application/json

{
  "userId": "user123",
  "userEmail": "user@example.com",
  "credits": {
    "hours": 2,
    "minutes": 30
  }
}
```

#### Generate Samsung Pay Pass
```http
POST /api/wallet/samsung-pay
Content-Type: application/json

{
  "userId": "user123",
  "userEmail": "user@example.com",
  "credits": {
    "hours": 2,
    "minutes": 30
  }
}
```

#### Generate Generic Wallet Pass
```http
POST /api/wallet/generic-pass
Content-Type: application/json

{
  "userId": "user123",
  "userEmail": "user@example.com",
  "credits": {
    "hours": 2,
    "minutes": 30
  }
}
```

### Health Check
```http
GET /health
```

## Apple Wallet Integration

### Requirements

1. **Apple Developer Account**
   - Enroll in Apple Developer Program ($99/year)
   - Create Pass Type ID
   - Generate Pass Type certificate

2. **PassKit Certificates**
   - Download .p12 files from Apple Developer
   - Place in `certs/` directory
   - Set correct password in environment

3. **Pass Template**
   - Customize `pass.json` with your branding
   - Add required images (icon, logo, strip)
   - Configure pass fields and styling

### .pkpass File Structure

The generated .pkpass file contains:
- `pass.json` - Pass configuration
- `manifest.json` - File hashes
- `signature` - Cryptographic signature
- Images and assets

### MIME Type

The server serves .pkpass files with:
```
Content-Type: application/vnd.apple.pkpass
Content-Disposition: attachment
```

## Frontend Integration

### Example Usage

```javascript
// Generate Apple Wallet pass
const response = await fetch('http://localhost:3001/api/wallet/apple-pass', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.uid,
    userEmail: user.email,
    credits: { hours: 2, minutes: 30 }
  })
});

const result = await response.json();
if (result.success) {
  // For Safari: redirect to .pkpass file
  if (isMobileSafari) {
    window.location.href = result.passUrl;
  } else {
    // For other browsers: download file
    const link = document.createElement('a');
    link.href = result.passUrl;
    link.download = result.filename;
    link.click();
  }
}
```

## Development

### Project Structure

```
backend/
├── server.js              # Main server file
├── package.json           # Dependencies
├── README.md             # This file
├── models/               # Pass templates
│   └── Generic.pass/
│       └── pass.json     # Pass configuration
├── certs/                # Apple certificates
│   ├── pass.p12         # Pass Type certificate
│   └── wwdr.p12         # WWDR certificate
└── passes/               # Generated .pkpass files
```

### Adding New Pass Types

1. Create new template in `models/`
2. Add new endpoint in `server.js`
3. Update frontend to call new endpoint
4. Test with target wallet app

### Debugging

- Check server logs for errors
- Verify certificate paths and passwords
- Ensure pass template is valid JSON
- Test MIME type headers

## Production Deployment

### Security Considerations

- Use HTTPS in production
- Secure certificate storage
- Implement rate limiting
- Add authentication/authorization
- Monitor file generation

### Scaling

- Implement file cleanup
- Add caching for generated passes
- Use CDN for static assets
- Monitor server performance

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=3001
PASS_CERT_PASSWORD=secure_password
HTTPS_KEY_PATH=/path/to/private.key
HTTPS_CERT_PATH=/path/to/certificate.crt
```

## Troubleshooting

### Common Issues

1. **Certificate Errors**
   - Verify certificate paths
   - Check certificate passwords
   - Ensure certificates are valid

2. **Pass Generation Fails**
   - Check pass template syntax
   - Verify required images exist
   - Check server logs for errors

3. **Safari Integration Issues**
   - Ensure .pkpass files are served over HTTPS
   - Verify MIME type headers
   - Check file structure and signature

4. **File Download Issues**
   - Check file permissions
   - Verify storage directory exists
   - Monitor disk space

### Support

For issues and questions:
- Check server logs
- Verify configuration
- Test with minimal pass template
- Consult Apple Developer documentation

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

**Note**: This server requires Apple Developer account and certificates for full Apple Wallet functionality. For development and testing, you can use the other wallet endpoints that don't require Apple certificates.
