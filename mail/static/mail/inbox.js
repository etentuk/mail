document.addEventListener("DOMContentLoaded", function () {
    // Use buttons to toggle between views
    document
        .querySelector("#inbox")
        .addEventListener("click", () => load_mailbox("inbox"));
    document
        .querySelector("#sent")
        .addEventListener("click", () => load_mailbox("sent"));
    document
        .querySelector("#archived")
        .addEventListener("click", () => load_mailbox("archive"));
    document.querySelector("#compose").addEventListener("click", compose_email);

    document.querySelector("form").onsubmit = send_mail;
    // By default, load the inbox
    load_mailbox("inbox");
});

function compose_email() {
    // Show compose view and hide other views
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "block";

    // Clear out composition fields
    document.querySelector("#compose-recipients").value = "";
    document.querySelector("#compose-subject").value = "";
    document.querySelector("#compose-body").value = "";
    if (document.querySelector("#form-error"))
        document.querySelector("#form-error").style.display = "none";
}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector("#emails-view").style.display = "block";
    document.querySelector("#compose-view").style.display = "none";

    // Show the mailbox name
    document.querySelector("#emails-view").innerHTML = `<h3>${
        mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
    }</h3>`;
}

function send_mail(e) {
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;

    fetch("/emails", {
        method: "POST",
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body,
        }),
    })
        .then((response) => response.json())
        .then((result) => {
            if (result.message === "Email sent successfully.") {
                load_mailbox("sent");
            } else {
                const errorAlert = document.querySelector("#form-error");
                if (errorAlert) {
                    errorAlert.innerHTML = result.error;
                    errorAlert.style.display = "block";
                } else {
                    document.querySelector("#compose-form").insertAdjacentHTML(
                        "beforebegin",
                        `<div class="alert alert-danger" role="alert" id="form-error">
                    ${result.error}
                  </div>`
                    );
                }
            }
        })
        .catch((e) => {
            console.log("e", e);
        });

    return false;
}
