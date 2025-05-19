"""
Security utility functions for the everyst API.
Includes functions for password hashing, verification, and generating secure tokens.
"""
import secrets
import string
import hashlib
import binascii
import os

def generate_random_string(length=12):
    """
    Generate a cryptographically secure random string of specified length
    """
    characters = string.ascii_letters + string.digits + string.punctuation
    secure_string = ''.join(secrets.choice(characters) for _ in range(length))
    return secure_string

def hash_password(password):
    """
    Hash a password for storing using PBKDF2 with a random salt
    """
    # Generate a random salt
    salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
    
    # Hash password with salt
    password_hash = hashlib.pbkdf2_hmac(
        'sha512',
        password.encode('utf-8'),
        salt,
        100000,  # number of iterations
        dklen=128  # length of the derived key
    )
    
    # Format as salt:hash
    password_hash = binascii.hexlify(password_hash)
    return (salt + password_hash).decode('ascii')

def verify_password(stored_password, provided_password):
    """
    Verify a stored password against a provided password
    """
    # Extract salt
    salt = stored_password[:64]
    
    # Extract hash from stored password
    stored_hash = stored_password[64:]
    
    # Hash the provided password with the extracted salt
    password_hash = hashlib.pbkdf2_hmac(
        'sha512',
        provided_password.encode('utf-8'),
        salt.encode('ascii'),
        100000,  # number of iterations
        dklen=128  # length of the derived key
    )
    
    # Format as hash
    password_hash = binascii.hexlify(password_hash).decode('ascii')
    
    # Compare the stored hash with the newly calculated hash
    return password_hash == stored_hash
