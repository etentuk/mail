window.onpopstate = function (event) {
    update(event.state?.page?.split("#")[1] || "inbox");
};

document.addEventListener("DOMContentLoaded", function () {
    document
        .querySelector("#email-archive")
        .addEventListener("click", (e) => archive_email(e));

    document.querySelector("#email-reply").addEventListener("click", (e) => {
        compose_email(e, true);
    });

    // By default, load the inbox
    document.querySelector("nav").addEventListener("click", (e) => {
        if (!e.target.id) return;
        history.pushState({ page: `#${e.target.id}` }, "", `#${e.target.id}`);
        update(e.target.id);
    });

    (() => {
        update(window.location.hash.split("#")[1]);
    })();
});

const data = {
    mailbox: (mail) => load_mailbox(mail),
    compose: () => compose_email(),
};

const update = (updater) => {
    updater = updater || "inbox";
    if (["compose", "inbox", "archive", "sent"].includes(updater)) {
        if (updater === "compose") {
            compose_email();
        } else {
            load_mailbox(updater);
        }
        return;
    } else {
        error_handler({
            title: "Page not Found!",
            body: "The requested URL is not found",
        });
    }

    let path = updater.split("/");
    if (path[1]) {
        viewEmail(path[1], path[0]);
        return;
    }
};

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector("#emails-view").style.display = "block";
    document.querySelector("#compose-view").style.display = "none";
    document.querySelector("#not-found").style.display = "none";
    document.querySelector("#email-view").style.display = "none";

    // Show the mailbox name
    document.querySelector("#emails-view").innerHTML = `<h1>${
        mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
    }</h1>`;
    fetch(`/emails/${mailbox}`)
        .then((response) => {
            if (response.ok) return response.json();
            throw new Error();
        })
        .then((result) => {
            result.forEach((email) => {
                document
                    .querySelector("#emails-view")
                    .insertAdjacentHTML(
                        "beforeend",
                        `<div type="button" style="background-color: ${
                            email.read && mailbox !== "sent" ? "gray" : "white"
                        }" class="list-group-item d-flex justify-content-between flex-row " id="email-${email.id.toString()}"> <div><p>${
                            mailbox === "sent" ? "To" : "From"
                        }: ${
                            mailbox === "sent"
                                ? email.recipients[0]
                                : email.sender
                        }</p></div> <div><p>${
                            email.subject
                        }</p></div> <div><p>${email.timestamp}</p></div></div>`
                    );
                document
                    .querySelector(`#email-${email.id}`)
                    .addEventListener("click", () => {
                        history.pushState(
                            { page: `#${mailbox}/${email.id}` },
                            "",
                            `#${mailbox}/${email.id}`
                        );
                        viewEmail(email.id, mailbox);
                    });
            });
        })
        .catch((e) => {
            error_handler({
                title: "404 Not Found",
                body: "The page you are looking for does not exist",
            });
            console.log(e);
        });
}

function compose_email(e, isReply) {
    // Show compose view and hide other views
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#email-view").style.display = "none";
    document.querySelector("#not-found").style.display = "none";
    document.querySelector("#compose-view").style.display = "block";

    // Clear out composition fields
    if (isReply) {
        fetch(`emails/${e.target.dataset.id}`)
            .then((response) => {
                if (!response.ok) throw new Error();
                return response.json();
            })
            .then((result) => {
                document.querySelector("#compose-title").innerHTML =
                    "Reply Email";
                document.querySelector("#compose-recipients").value =
                    result.sender;
                document.querySelector(
                    "#compose-subject"
                ).value = `Re: ${result.subject}`;
                document.querySelector(
                    "#compose-body"
                ).value = `On ${result.timestamp} ${result.sender} wrote: ${result.body}`;
            })
            .catch((e) => {
                console.log(e);
                error_handler({
                    title: "An error occured",
                    body: "Please refresh and try again.",
                });
            });
    } else {
        document.querySelector("#compose-recipients").value = "";
        document.querySelector("#compose-subject").value = "";
        document.querySelector("#compose-body").value = "";
    }

    if (document.querySelector("#form-error"))
        document.querySelector("#form-error").style.display = "none";

    document.querySelector("form").onsubmit = function () {
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
            .then((response) => {
                if (response.ok) return response.json();
                throw new Error();
            })
            .then((result) => {
                if (result.message === "Email sent successfully.") {
                    load_mailbox("sent");
                } else {
                    const errorAlert = document.querySelector("#form-error");
                    if (errorAlert) {
                        errorAlert.innerHTML = result.error;
                        errorAlert.style.display = "block";
                    } else {
                        document
                            .querySelector("#compose-form")
                            .insertAdjacentHTML(
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
                error_handler({
                    title: "Oops! an error occured",
                    body: "Please try again.",
                });
            });
        return false;
    };
}

function viewEmail(id, mailbox) {
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "none";
    document.querySelector("#not-found").style.display = "none";
    document.querySelector("#email-view").style.display = "block";

    fetch(`/emails/${id}`)
        .then((response) => {
            if (response.ok) return response.json();
            throw new Error();
        })
        .then((result) => {
            if (
                (mailbox === "inbox" && result.archived) ||
                (mailbox === "archived" && !result.archived)
            ) {
                throw new Error();
            }
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

            document.querySelector("#email-reply").dataset.id = result.id;

            const archive_element = document.querySelector("#email-archive");
            archive_element.dataset.id = result.id;
            archive_element.dataset.archived = result.archived;
            archive_element.innerText = result.archived
                ? "Unarchive"
                : "Archive";
            if (mailbox === "sent") {
                document.querySelector("#email-archive").style.display = "none";
                document.querySelector("#email-reply").style.display = "none";
            } else {
                document.querySelector("#email-archive").style.display =
                    "inline-block";
                document.querySelector("#email-reply").style.display =
                    "inline-block";
            }
        })
        .then(() => {
            fetch(`emails/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    read: true,
                }),
            });
        })
        .catch((e) => {
            console.log(e);
            return error_handler({
                title: "404 Not Found",
                body: "The page you are looking for does not exist",
            });
        });
}

function archive_email(e) {
    const archived = e.target.dataset.archived === "true";
    fetch(`emails/${e.target.dataset.id}`, {
        method: "PUT",
        body: JSON.stringify({
            archived: !archived,
        }),
    })
        .then((response) => {
            if (response.ok) {
                history.pushState({ page: "#inbox" }, "", "#inbox");
                load_mailbox("inbox");
            }
        })
        .catch((e) => {
            console.log(e);
            error_handler({
                title: "Oops an Error Occurred!",
                body: "Please try again!",
            });
        });
}

function error_handler(error) {
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "none";
    document.querySelector("#email-view").style.display = "none";
    document.querySelector("#not-found").style.display = "block";

    document.getElementById("nf-title").innerHTML = error.title;
    document.getElementById("nf-body").innerHTML = error.body;
}
