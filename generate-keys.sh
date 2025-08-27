#/bin/bash

# Chave privada (private.pem)
openssl genrsa -out private.pem 2048

# Chave pública (public.pem)
openssl rsa -in private.pem -pubout -out public.pem

