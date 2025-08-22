#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script principal pour démarrer les deux serveurs avec des ports dynamiques
"""
import subprocess
import sys
import os
import time
from pathlib import Path

def run_command_in_background(command, cwd=None):
    """Exécute une commande en arrière-plan"""
    return subprocess.Popen(
        command, 
        shell=True, 
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

def main():
    import sys
    # Force UTF-8 pour Windows
    if sys.platform == 'win32':
        import subprocess
        subprocess.run('chcp 65001', shell=True, capture_output=True)
    
    print("🚀 Démarrage des serveurs GameSub...")
    
    # Redémarre les serveurs actuels
    print("⚠️ Arrêt des serveurs existants...")
    try:
        # Kill processes on common ports
        for port in [8000, 8001, 3000, 3001, 3002, 3003, 3004]:
            try:
                subprocess.run(f'netstat -ano | findstr :{port}', shell=True, capture_output=True)
            except:
                pass
    except:
        pass
    
    print("📡 Démarrage du serveur Django...")
    django_process = run_command_in_background("python start_django.py")
    
    print("⚛️ Démarrage du serveur React...")
    react_process = run_command_in_background("node start_frontend.js", cwd="frontend")
    
    print("✅ Les serveurs sont en cours de démarrage...")
    print("📝 Ports utilisés:")
    
    # Attendre un peu pour que les fichiers de port soient créés
    time.sleep(3)
    
    try:
        if os.path.exists("django_port.txt"):
            with open("django_port.txt", "r") as f:
                django_port = f.read().strip()
                print(f"   Django: http://localhost:{django_port}")
    except:
        print("   Django: http://localhost:8001 (par défaut)")
    
    try:
        if os.path.exists("frontend/react_port.txt"):
            with open("frontend/react_port.txt", "r") as f:
                react_port = f.read().strip()
                print(f"   React:  http://localhost:{react_port}")
    except:
        print("   React:  http://localhost:3001 (par défaut)")
    
    print("\n🎮 GameSub est prêt ! Appuyez sur Ctrl+C pour arrêter les serveurs.")
    
    try:
        # Garde les processus en vie
        django_process.wait()
        react_process.wait()
    except KeyboardInterrupt:
        print("\n⚠️ Arrêt des serveurs...")
        django_process.terminate()
        react_process.terminate()
        
        # Nettoie les fichiers de port
        try:
            os.remove("django_port.txt")
            os.remove("frontend/react_port.txt")
        except:
            pass
        
        print("✅ Serveurs arrêtés proprement")

if __name__ == "__main__":
    main()