var ui = new firebaseui.auth.AuthUI(firebase.auth());

// Configuration for Sign In
var signInConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            return true;
        },
        uiShown: function () {
            document.getElementById('loader').style.display = 'none';
        }
    },
    signInSuccessUrl: 'main.html',
    signInOptions: [
        {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: false,
            signInMethod: firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
            disableSignUp: {
                status: true
            }
        }
    ],
    signInFlow: 'popup',
    credentialHelper: firebaseui.auth.CredentialHelper.NONE
};

// Configuration for Sign Up
var signUpConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            var user = authResult.user;                            // get the user object from the Firebase authentication database
            if (authResult.additionalUserInfo.isNewUser) {         //if new user
                db.collection("users").doc(user.uid).set({         //write to firestore. We are using the UID for the ID in users collection
                    name: user.displayName,                    //"users" collection
                    email: user.email,                         //with authenticated user's ID (user.uid)
                    country: "Canada",                      //optional default profile info      
                    school: "BCIT"                          //optional default profile info
                }).then(function () {
                    console.log("New user added to firestore");
                    window.location.assign("main.html");       //re-direct to main.html after signup
                }).catch(function (error) {
                    console.log("Error adding new user: " + error);
                });
            } else {
                return true;
            }
            return false;
        },
        uiShown: function () {
            document.getElementById('loader').style.display = 'none';
        }
    },
    signInSuccessUrl: 'main.html',
    signInOptions: [
        {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: true,
            signInMethod: firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
            disableSignUp: {
                status: false
            }
        }
    ],
    signInFlow: 'popup',
    credentialHelper: firebaseui.auth.CredentialHelper.NONE
};

// Functions to show Sign In or Sign Up
function showSignIn() {
    document.getElementById('firebaseui-auth-container').classList.remove('hidden');
    document.getElementById('loader').classList.remove('hidden');
    ui.start('#firebaseui-auth-container', signInConfig);
}

function showSignUp() {
    document.getElementById('firebaseui-auth-container').classList.remove('hidden');
    document.getElementById('loader').classList.remove('hidden');
    ui.start('#firebaseui-auth-container', signUpConfig);
}

// Logout functionality
function logout() {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
        console.log("Logged out successfully");
        window.location.href = "index.html"; // Redirect to landing page
    }).catch((error) => {
        // An error happened.
        console.error("Error logging out:", error);
    });
}