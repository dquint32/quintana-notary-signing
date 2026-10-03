Quintana Notary & Signing – Official Website  
Welcome to the official repository for Quintana Notary & Signing!  
This repository contains the source code and assets for a bilingual (Spanish/English) website designed to provide mobile Colorado notary services, translation support, and community-focused accessibility.

📘 About the Project  
Business: Quintana Notary & Signing – Mobile Notary & Translation Services  
Location: Denver Metro Area (including Aurora and Highlands Ranch)  
Founder: David Quintana, Senior in Human-Centered Information Systems (HCIS), MSU Denver  
This project demonstrates:

- Accessible, bilingual (Spanish/English) web design  
- Professional branding and layout consistency across multiple service pages  
- Clear disclaimers and compliance with Colorado notary law  
- Integration of translation services and community-focused mission  

🌐 Live Site  
The project is hosted on GitHub Pages:  
👉 View Quintana Notary & Signing  

📂 Repository Contents  
- `index.html` – Home page  
- `services.html` – Services overview  
- `translate.html` – Translation services  
- `pricing.html` – Pricing details  
- `about.html` – About the notary  
- `faq.html` – Frequently asked questions  
- `contact.html` – Contact & location info  
- `styles.css` – Global stylesheet  
- `images/` – Logo and service-related visuals  
- `README.md` – Project documentation  

👨‍🎓 About Me  
I’m a Health Informatics (B.S.) graduate of MSU Denver.  
My focus is on:

- Building accessible, bilingual web experiences  
- Designing systems that balance compliance, usability, and professionalism  
- Supporting families, seniors, and small businesses through technology and clear communication  

I also run entrepreneurial projects like **Quintana Notary & Signing** and **Ayuda DMV**, combining academic knowledge with real-world service.

⚖️ Purpose  
This repository exists to:

- Provide a live, accessible demo site for clients and community members  
- Showcase my ability to combine technical skills with professional service delivery  
- Document the official website for Quintana Notary & Signing  

📬 Contact  
For questions about this project or services:  
**David Quintana**  
Quintana Notary & Signing – Mobile Colorado Notary  
MSU Denver – Health Informatics (B.S.) graduate  

🌐 Languages (English and Spanish pages)

Every page in this folder holds both languages. English is the one visible in the file; the Spanish twin of each page lives in `es/` and is **generated**:

1. Edit the pages in this folder (never the copies in `es/`).
2. Run `python build_es.py`. It rebuilds `es/*.html` and `sitemap.xml`.
3. Commit everything, including the `es/` folder.

How visitors get their language:

- The address decides: `/es/...` is Spanish, everything else is English.
- A phone or browser set to Spanish is sent to the Spanish page on its first visit.
- The language button opens the twin page and remembers the choice.

Wording rule (C.R.S. 24-21-525): the Spanish noun for a notary, and the word for a notary's office, must never appear anywhere, including titles, descriptions and keywords. Say "Notary Public" or "servicios notariales". `build_es.py` stops if it finds either word.
