const socket = io();

const messageInput = document.getElementById("message_input");
const username = document.getElementById("user");
const form = document.getElementById("form");

socket.on('receive-message', (message, user, timestamp) => {
    displayMessage(message, user, timestamp);
});

form.addEventListener("submit", e => {
    e.preventDefault(); // Stop submit button from reloading the entire web page.
    const message = messageInput.value;
    const user = username.value

    let rawtime = new Date().toLocaleString("fi-FI", {timeZone: 'Europe/Helsinki', hour12: false, hourCycle: 'h23'})
    rawtime = rawtime.split(" ")
    if ( (rawtime[1])[1] == ('.') ) // Check for a missing 0 at the start of the string.
    {
    rawtime[1] = "0" + rawtime[1] // There's probably a method for this in Date, but I couldn't find it.
    }
    const timestamp = `${rawtime[0].split(".").join("/")} ${rawtime[1].slice(0, 5).split(".").join(":")}`
    
    if (message === "") return; // Don't emit empty messages.
    displayMessage(message, user, timestamp); // Display message to user.
    socket.emit('send-message', message, user, timestamp) // Emit message to other users.
    
    messageInput.value = "";

});

function displayMessage(message, user, timestamp)
{
    const container = document.getElementById('message_container');

    const div = document.createElement('div');
    div.textContent = `${timestamp}, ${user}: ${message}`;
    container.append(div);

    container.scrollTop = container.scrollHeight; // Auto scroll to bottom.
}