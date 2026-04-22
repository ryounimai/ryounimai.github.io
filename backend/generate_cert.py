"""
generate_cert.py — Buat self-signed SSL certificate untuk ŘΨØŬ
Jalankan sekali: python generate_cert.py
Requires: pip install cryptography
"""
import os, sys

try:
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.backends import default_backend
    import datetime, socket
except ImportError:
    print("Install dulu: pip install cryptography")
    sys.exit(1)

_here = os.path.dirname(os.path.abspath(__file__))

# Detect local IP
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    LOCAL_IP = s.getsockname()[0]; s.close()
except Exception:
    LOCAL_IP = "127.0.0.1"

key = rsa.generate_private_key(
    public_exponent=65537, key_size=2048, backend=default_backend())

subject = issuer = x509.Name([
    x509.NameAttribute(NameOID.COUNTRY_NAME, "ID"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, "RYOU Media Server"),
    x509.NameAttribute(NameOID.COMMON_NAME, LOCAL_IP),
])

cert = (
    x509.CertificateBuilder()
    .subject_name(subject)
    .issuer_name(issuer)
    .public_key(key.public_key())
    .serial_number(x509.random_serial_number())
    .not_valid_before(datetime.datetime.utcnow())
    .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=3650))
    .add_extension(x509.SubjectAlternativeName([
        x509.IPAddress(__import__("ipaddress").ip_address(LOCAL_IP)),
        x509.IPAddress(__import__("ipaddress").ip_address("127.0.0.1")),
    ]), critical=False)
    .sign(key, hashes.SHA256(), default_backend())
)

with open(os.path.join(_here, "key.pem"), "wb") as f:
    f.write(key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.TraditionalOpenSSL,
        serialization.NoEncryption(),
    ))

with open(os.path.join(_here, "cert.pem"), "wb") as f:
    f.write(cert.public_bytes(serialization.Encoding.PEM))

print(f"✓ cert.pem + key.pem dibuat untuk IP: {LOCAL_IP}")
print("  Restart server.py untuk mengaktifkan HTTPS.")
