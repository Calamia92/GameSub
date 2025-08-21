#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script pour demarrer Django avec un port dynamique
"""
import socket
import subprocess
import sys
import os

def is_port_available(port):
    """Vérifie si un port est disponible"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        try:
            sock.bind(('localhost', port))
            return True
        except OSError:
            return False

def find_available_port(start_port=8000):
    """Trouve le premier port disponible à partir du port de départ"""
    port = start_port
    while port < start_port + 100:  # Limite la recherche à 100 ports
        if is_port_available(port):
            return port
        port += 1
    raise Exception(f"Aucun port disponible trouvé entre {start_port} et {start_port + 100}")

def main():
    try:
        # Trouve un port disponible
        port = find_available_port(8000)
        print(f"[DJANGO] Demarrage sur le port {port}")
        
        # Sauvegarde le port dans un fichier pour que le frontend puisse le lire
        with open('django_port.txt', 'w') as f:
            f.write(str(port))
        
        # Demarre Django
        subprocess.run([sys.executable, 'manage.py', 'runserver', str(port)], check=True)
        
    except KeyboardInterrupt:
        print("\n[DJANGO] Arret du serveur")
    except Exception as e:
        print(f"[DJANGO] Erreur: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()