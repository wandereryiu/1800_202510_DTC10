# SimplSaving

##  Overview

**SimplSaving** is a client-side JavaScript web application designed to help students and recent graduates build healthy financial habits by tracking expenses, setting savings goals, and managing student loans — all from one mobile-friendly experience.

This project was developed for the **COMP1800** course at BCIT. It incorporates user-centered design principles and agile development methods. The app is built with tailwind CSS for responsive styling, chart.js for interactive insights, and firebase for backend services including authentication, firestore, and hosting.

---

##  Features

- Track and categorize daily spending
- Set and monitor multiple savings goals
- Visual insights through dynamic charts
- Manage student loans with interest calculations
- Secure login and authentication using Firebase
- Fully responsive layout for mobile and desktop

---

##  Technologies Used

- **Frontend**: HTML, Tailwind CSS, JavaScript
- **Backend Services**: Firebase Authentication, Firestore, Firebase Hosting
- **Visualization**: Chart.js
- **UI Assets**: Google Fonts, Lucide Icons

---

## Usage

1. Open the app in your browser.
2. Create an account or log in using Firebase Authentication.
3. Navigate through the main dashboard to:
   - Log expenses in the **Spending** section
   - Create and manage goals in the **Goals** section
   - View personalized charts in the **Insights** section
   - Track student loans in the **Student Loans** section
4. Visit the **Profile** page to update personal information or change your password.

---

## Project Structure

```plaintext
1800_202510_DTC10/
├── src/
│   ├── index.html
│   ├── login.html
│   ├── main.html
│   ├── profile.html
│   ├── spending.html
│   ├── goals.html
│   ├── eachgoal.html
│   ├── insights.html
│   ├── eachinsights.html
│   ├── student_loans.html
│   └── template.html
│
│   ├── styles/
│   │   └── style.css
│
│   ├── scripts/
│   │   ├── app.js
│   │   ├── firebaseAPI_dtcteam10.js
│   │   ├── authentication.js
│   │   ├── skeleton.js
│   │   ├── navbar.js
│   │   ├── main.js
│   │   ├── profile.js
│   │   ├── spending.js
│   │   ├── goals.js
│   │   ├── eachgoal.js
│   │   ├── insights.js
│   │   ├── eachinsights.js
│   │   └── studentloans.js
│
│   ├── components/
│   │   ├── footer.html
│   │   ├── nav_before_login.html
│   │   └── nav_after_login.html
│
│   ├── images/
│   │   ├── 3347971.png
│   │   ├── logo.jpeg
│   │   ├── saving.png
│   │   └── welcomebannerpiggy.png
│
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

##  Contributors

- Yi Yu Zhao  
- Koko Onuwavbagbe  
- Brandon Berge  

---

##  Acknowledgments

- Firebase services for authentication and Firestore database: [firebase.google.com](https://firebase.google.com/)
- Chart visualization powered by [Chart.js](https://www.chartjs.org/)
- Tailwind CSS for styling: [tailwindcss.com](https://tailwindcss.com/)
- Icons and UI inspiration from [Lucide](https://lucide.dev/) and [Heroicons](https://heroicons.com/)
- Fonts via [Google Fonts](https://fonts.google.com/)
- Code references and syntax support from [MDN Web Docs](https://developer.mozilla.org/) and [Stack Overflow](https://stackoverflow.com/)

---

##  Limitations and Future Work

### Limitations
- Expense categories are currently fixed and not user-defined
- Loan payoff logic assumes standard amortization only
- Accessibility features (e.g., keyboard navigation, ARIA roles) are minimal
- No offline support or caching for offline data entry

### Future Work
- Allow users to create custom expense categories
- Add predictive insights (e.g., estimated monthly totals)
- Implement dark mode and enhanced accessibility features
- Improve mobile performance and responsiveness
- Introduce dashboards and widgets for personalization

---

##  License

This project is licensed under the **MIT License**. See the `LICENSE` file for full details.
