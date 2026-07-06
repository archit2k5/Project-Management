import Mailgen from "mailgen";

const emailVerificationEmailGenContent = function (username, emailVerificationLink){
    return {
        body:{
            name: username,
            intro: "Welcome to our App, we are excited to have you on board"
        },
        action:{
            instruction: "To verify your email, click the button below",
            button:{
                color: "#22BC64",
                text: "Verify your email",
                link: emailVerificationLink
            }
        },
        outro: "Need help, or feel stuck? Reply with help on the mail and we will be pleased to help"
    }
}

const forgotPasswordEmailGenContent = function (username, forgetPasswordLink){
    return {
        body:{
            name: username,
            intro: "Welcome to our App, we are excited to have you on board"
        },
        action:{
            instruction: "To reset your password, click on the button below",
            button:{
                color: "#22BC64",
                text: "Forget Password",
                link: forgetPasswordLink
            }
        },
        outro: "Need help, or feel stuck? Reply with help on the mail and we will be pleased to help"
    }
}