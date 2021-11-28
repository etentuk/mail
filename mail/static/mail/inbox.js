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

    document.querySelector("form").onsubmit = send_mail;

    document
        .querySelector("#email-archive")
        .addEventListener("click", archive_email);

    // By default, load the inbox
    load_mailbox("inbox");
});

function compose_email() {
    // Show compose view and hide other views
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#email-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "block";

    // Clear out composition fields
    document.querySelector("#compose-recipients").value = "";
    document.querySelector("#compose-subject").value = "";
    document.querySelector("#compose-body").value = "";
    if (document.querySelector("#form-error"))
        document.querySelector("#form-error").style.display = "none";
}
let counter = 0;

function load_mailbox(mailbox) {
    console.log("called", counter++);
    // Show the mailbox and hide other views
    document.querySelector("#emails-view").style.display = "block";
    document.querySelector("#compose-view").style.display = "none";
    document.querySelector("#email-view").style.display = "none";
    document.querySelector("#emails-view").innerHTML = "";

    // Show the mailbox name
    document.querySelector("#emails-view").innerHTML = `<h3>${
        mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
    }</h3>`;

    fetch(`/emails/${mailbox}`)
        .then((response) => response.json())
        .then((result) => {
            result.forEach((email) => {
                document
                    .querySelector("#emails-view")
                    .insertAdjacentHTML(
                        "beforeend",
                        `<div type="button" style="background-color: ${
                            email.read && mailbox !== "sent" ? "gray" : "white"
                        }" class="d-flex list-group-item list-group-item-action row" id="email-${email.id.toString()}"> <p class="col">${
                            mailbox === "sent" ? "To" : "From"
                        }: ${
                            mailbox === "sent"
                                ? email.recipients[0]
                                : email.sender
                        }</p> <p class="col">${
                            email.subject
                        }</p> <p class="col">${email.timestamp}</p></div>`
                    );
                document
                    .querySelector(`#email-${email.id}`)
                    .addEventListener("click", () =>
                        viewEmail(email.id, mailbox)
                    );
            });
        })
        .catch((e) => console.log(e));
}

function viewEmail(id, mailbox) {
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "none";
    document.querySelector("#email-view").style.display = "block";

    fetch(`/emails/${id}`)
        .then((response) => response.json())
        .then((result) => {
            document.querySelector("#email-subject").innerText = result.subject;
            document.querySelector(
                "#email-recipients"
            ).innerText = `Recipients: ${result.recipients}`;
            document.querySelector(
                "#email-sender"
            ).innerText = `Sender: ${result.sender}`;
            document.querySelector("#email-body").innerText = result.body;
            document.querySelector("#email-timestamp").innerText =
                result.timestamp;

            const archive_element = document.querySelector("#email-archive");
            archive_element.dataset.id = result.id;
            archive_element.dataset.archived = result.archived;
            archive_element.innerText = result.archived
                ? "Unarchive"
                : "Archive";
            if (mailbox === "sent")
                document.querySelector("#email-archive").style.display = "none";
        })
        .then(() => {
            fetch(`emails/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    read: true,
                }),
            });
        })
        .catch((e) => console.log(e));
}

function archive_email(e) {
    const archived = e.target.dataset.archived === "true";
    fetch(`emails/${e.target.dataset.id}`, {
        method: "PUT",
        body: JSON.stringify({
            archived: !archived,
        }),
    })
        .then(() => load_mailbox("inbox"))
        .catch((e) => console.log(e));
}

function send_mail() {
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
