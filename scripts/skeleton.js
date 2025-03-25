//---------------------------------------------------
// This function loads the parts of your skeleton 
// (navbar, footer, and other things) into html doc. 
//---------------------------------------------------
function loadSkeleton() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // If the "user" variable is not null, then someone is logged in
            // User is signed in.
            loadContent('navbarPlaceholder', './text/nav_after_login.html');
            loadContent('footerPlaceholder', './text/footer.html');
        } else {
            // No user is signed in.
            loadContent('navbarPlaceholder', './text/nav_before_login.html');
            loadContent('footerPlaceholder', './text/footer.html');
        }
    });
}

// Helper function to load content
function loadContent(elementId, url) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            document.getElementById(elementId).innerHTML = data;
            console.log(`Content loaded into #${elementId}`);
        })
        .catch(error => console.error('Error loading content:', error));
}

loadSkeleton(); // invoke the function

