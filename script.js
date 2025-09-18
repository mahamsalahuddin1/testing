const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const themeToggle = document.getElementById("theme-toggle");
const body = document.body;

let currentLevel = null; // Track the current chatbot level
let chatbotData = {}; // Global scope variable
let navigationStack = []; // To track the user's navigation history
let userName = ""; // Store user's name
let userPhone = ""; // Store user's phone number
let introCompleted = false; // Track if the introduction is complete

// Load JSON Data
fetch('chatbot_data.json')
    .then(response => {
        if (!response.ok) throw new Error("Failed to fetch chatbot data.");
        return response.json();
    })
    .then(data => {
        chatbotData = data.levels; // Access levels from the JSON file
        console.log("Chatbot data loaded successfully:", chatbotData);
        initializeChat();
    })
    .catch(error => {
        console.error("Error loading chatbot data:", error);
        appendMessage("Error loading chatbot. Please try again later.");
    });

// Toggle Light/Dark Theme
themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");
    themeToggle.textContent = body.classList.contains("dark") ? "☀️" : "🌙";
});

// Append Message to Chat
// Append Message to Chat with Icon
function appendMessage(message, isUser = false) {
    const messageContainer = document.createElement("div");
    messageContainer.className = isUser
        ? "message-container user-message-container"
        : "message-container bot-message-container";

    // Create Icon
    const iconElement = document.createElement("div");
    iconElement.className = "message-icon";
    iconElement.textContent = isUser ? "👤" : "🤖";

    // Apply user-specific styles if necessary
    if (isUser) {
        iconElement.classList.add("user-icon");
    }

    // Create Message Element
    const messageElement = document.createElement("div");
    messageElement.className = isUser ? "user-message message" : "bot-message message";
    messageElement.textContent = message;

    // Append Icon and Message to Container
    messageContainer.appendChild(iconElement);
    messageContainer.appendChild(messageElement);

    // Append to Chat Box
    chatBox.appendChild(messageContainer);
    scrollChatToBottom();
}



// Ensure Chat Box Scrolls to Bottom
function scrollChatToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom of the chat
}

// Initialize Chat
function initializeChat() {
    appendMessage("👋 The chat is ready. Please type 'Hi' or any greeting to start!");
    currentLevel = null; // Start with null level for the introduction
}

// Handle User Input
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        processUserMessage(); // Process the message when Enter is pressed
    }
});

sendBtn.addEventListener("click", processUserMessage); // Process the message when send button is clicked

// Reusable function to process user messages
function processUserMessage() {
    const userMessage = userInput.value.trim();
    if (userMessage) {
        appendMessage(userMessage, true); // Display user message on the right
        userInput.value = ""; // Clear input field
        processInput(userMessage); // Process input with existing chatbot logic
    }
}


// Process User Input
function processInput(input) {
    const normalizedInput = input.toLowerCase();

    if (!introCompleted) {
        handleIntroduction(normalizedInput);
    } else if (currentLevel) {
        const currentOptions = chatbotData[currentLevel]?.options;

        if (currentOptions) {
            const matchedOption = currentOptions.find(option =>
                option.text.toLowerCase().includes(normalizedInput)
            );

            if (matchedOption && matchedOption.next) {
                navigateTo(matchedOption.next);
            } else {
                appendMessage("Sorry, I couldn't understand that. Please select an option or try again.");
            }
        } else {
            appendMessage("Sorry, no options available at this level.");
        }
    }
}

// Handle the Introductory Flow
function handleIntroduction(input) {
    if (currentLevel === null) {
        if (["hi", "hello", "good morning", "good evening", "hey"].some(greet => input.includes(greet))) {
            appendMessage("Hey! Welcome to Emirates Aviation University. May I know your name please?");
            currentLevel = "get_name";
        } else {
            appendMessage("Please type a greeting to start the chat.");
        }
    } else if (currentLevel === "get_name") {
        userName = input;
        appendMessage(`Nice to meet you, ${userName}! Please give me your phone number so EAU can contact you for your admission assistance.`);
        currentLevel = "get_phone";
    } else if (currentLevel === "get_phone") {
        if (/^\d{10}$/.test(input) || /^\d{6,15}$/.test(input)) { // Validate phone number format
            userPhone = input;
            appendMessage(`Thank you, ${userName}!`);
            introCompleted = true;
            navigateTo("level1", true); // Start the main chatbot flow
        } else {
            appendMessage("Please provide a valid phone number.");
        }
    }
}

// Navigate to Next Level
function navigateTo(levelKey, isMainMenu = false) {
    console.log("Navigating to:", levelKey);
    if (!isMainMenu && currentLevel) {
        navigationStack.push(currentLevel);
    }
    currentLevel = levelKey;

    const level = chatbotData[levelKey];
    if (!level) {
        appendMessage("Sorry, I don't have information on that.");
        return;
    }

    // Remove previous options and navigation buttons
    const previousOptions = document.querySelectorAll(".grid-container, .nav-buttons");
    previousOptions.forEach(element => element.remove());

    // Append level content
    if (level.answer) {
        appendMessage(level.answer);
    }
    if (level.question) {
        appendMessage(level.question);
    }
    if (level.options) {
        appendOptions(level.options);
    }

    // Add navigation buttons
    appendNavigationButtons();
}

// Append Buttons for Options
function appendOptions(options) {
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "grid-container";

    options.forEach(option => {
        const optionButton = document.createElement("button");
        optionButton.className = "option-btn";
        optionButton.textContent = option.text;

        optionButton.onclick = () => {
            appendMessage(option.text, true); // Show user's choice as a user message
            console.log("Option clicked:", option.next); // Debugging info
            if (option.next) {
                navigateTo(option.next);
            } else {
                appendMessage("Sorry, this option has no further information.");
            }
        };

        optionsContainer.appendChild(optionButton);
    });

    chatBox.appendChild(optionsContainer);
    scrollChatToBottom(); // Ensure the chat scrolls to the bottom
}

// Append Navigation Buttons (Back and Main Menu)
function appendNavigationButtons() {
    const navButtons = document.createElement("div");
    navButtons.className = "nav-buttons";

    // Back button
    const backButton = document.createElement("button");
    backButton.textContent = "↩ Back";
    backButton.onclick = goBack;
    navButtons.appendChild(backButton);

    // Main Menu button
    const mainMenuButton = document.createElement("button");
    mainMenuButton.textContent = "🏠 Main Menu";
    mainMenuButton.onclick = () => navigateTo("level1", true); // Reset to main menu
    navButtons.appendChild(mainMenuButton);

    chatBox.appendChild(navButtons);
    scrollChatToBottom(); // Auto-scroll to display buttons
}

// Handle Back Button Logic
function goBack() {
    if (navigationStack.length > 0) {
        const previousLevel = navigationStack.pop();
        navigateTo(previousLevel);
    } else {
        appendMessage("You're already at the starting point!");
    }
}
