#!/usr/bin/env python3
"""
Script de validation des posts LinkedIn
Vérifie la longueur, les mots interdits et la structure
"""

import sys
import re

# Sortie en UTF-8 : évite une erreur d'encodage sous Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Mots interdits
FORBIDDEN_WORDS = [
    "bruit", "bruyant", "empiler", "fortement", "grincer", 
    "révélation", "brutale", "décor", "flou", "irritation", "vernis"
]

def count_characters(text):
    """Compte le nombre de caractères (espaces compris)"""
    return len(text)

def check_forbidden_words(text):
    """Vérifie la présence de mots interdits"""
    found_words = []
    text_lower = text.lower()
    
    for word in FORBIDDEN_WORDS:
        if word in text_lower:
            found_words.append(word)
    
    return found_words

def count_sentences_per_paragraph(text):
    """Compte le nombre de phrases par paragraphe"""
    paragraphs = text.split('\n\n')
    results = []
    
    for i, para in enumerate(paragraphs):
        if para.strip():
            # Compte les phrases (approximatif)
            sentences = len(re.findall(r'[.!?]+', para))
            results.append({
                'paragraph_num': i + 1,
                'sentences': sentences,
                'text': para[:50] + '...' if len(para) > 50 else para
            })
    
    return results

def validate_post(text):
    """Valide un post LinkedIn selon les critères"""
    
    print("=" * 60)
    print("VALIDATION DU POST LINKEDIN")
    print("=" * 60)
    
    # 1. Longueur
    char_count = count_characters(text)
    print(f"\n📏 Longueur: {char_count} caractères")
    
    if 550 <= char_count <= 750:
        print("   ✅ Longueur OK (550-750 caractères)")
    elif char_count < 550:
        print(f"   ⚠️  TROP COURT : il manque {550 - char_count} caractères")
    else:
        print(f"   ⚠️  TROP LONG : il faut supprimer {char_count - 750} caractères")
    
    # 2. Mots interdits
    print("\n🚫 Mots interdits:")
    forbidden = check_forbidden_words(text)
    
    if forbidden:
        print(f"   ❌ ATTENTION : {len(forbidden)} mot(s) interdit(s) trouvé(s):")
        for word in forbidden:
            print(f"      - {word}")
    else:
        print("   ✅ Aucun mot interdit")
    
    # 3. Structure des paragraphes
    print("\n📝 Structure des paragraphes:")
    para_analysis = count_sentences_per_paragraph(text)
    
    issues = []
    for para in para_analysis:
        if para['sentences'] > 2:
            issues.append(para)
    
    if issues:
        print(f"   ⚠️  {len(issues)} paragraphe(s) avec plus de 2 phrases:")
        for para in issues:
            print(f"      Paragraphe {para['paragraph_num']}: {para['sentences']} phrases")
            print(f"      '{para['text']}'")
    else:
        print("   ✅ Structure OK (max 2 phrases par paragraphe)")
    
    # Résumé final
    print("\n" + "=" * 60)
    all_good = (550 <= char_count <= 750) and not forbidden and not issues
    
    if all_good:
        print("✅ POST VALIDÉ - Prêt à publier!")
    else:
        print("⚠️  POST À CORRIGER")
    
    print("=" * 60)
    
    return all_good

def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_post.py <chemin_vers_fichier_post>")
        print("   ou: python validate_post.py '<texte du post>'")
        sys.exit(1)
    
    # Lire le texte
    input_text = sys.argv[1]
    
    # Si c'est un fichier (essayer d'ouvrir uniquement si ça ressemble à un chemin)
    import os
    if os.path.exists(input_text):
        try:
            with open(input_text, 'r', encoding='utf-8') as f:
                text = f.read()
        except:
            text = input_text
    else:
        # Sinon c'est directement le texte
        text = input_text
    
    validate_post(text)

if __name__ == "__main__":
    main()
