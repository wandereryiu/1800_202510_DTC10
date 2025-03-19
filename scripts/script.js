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
        if (user) {
            document.getElementById('userName').innerHTML = "Hello, " + user.displayName + "!";
        } else {
            document.getElementById('userName').innerHTML = "Hello, Guest!";
        }
    });
}

// Call the function when the page loads
displayUserName();

