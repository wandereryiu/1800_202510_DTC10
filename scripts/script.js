// Create Account OR Login

function sayHello() {
    //do something
}
//sayHello();    //invoke function

//------------------------------------------------
// Call this function when the "logout" button is clicked
//-------------------------------------------------
function logout() {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
        console.log("logging out user");
    }).catch((error) => {
        // An error happened.
    });
}

// Function to get the current user's display name
function displayUserName() {
    firebase.auth().onAuthStateChanged(user => {
        // Make sure the element exists before trying to set its innerHTML
        const userNameElement = document.getElementById('userName');
        if (!userNameElement) return;

        if (user) {
            userNameElement.innerHTML = "Hello, " + user.displayName + "!";
        } else {
            userNameElement.innerHTML = "Hello, Guest!";
        }
    });
}

// Wait for DOM to be fully loaded before calling displayUserName
document.addEventListener('DOMContentLoaded', function () {
    displayUserName();
});

