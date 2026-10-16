document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function createTextElement(tagName, text, className) {
    const element = document.createElement(tagName);
    element.textContent = text;
    if (className) {
      element.className = className;
    }
    return element;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.replaceChildren();
      activitiesList.setAttribute("aria-busy", "false");
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;
        const heading = createTextElement("h4", name);
        const description = createTextElement("p", details.description);
        const schedule = document.createElement("p");
        const availability = document.createElement("p");
        const participantsContainer = document.createElement("div");

        const scheduleLabel = createTextElement("strong", "Schedule:");
        schedule.append(
          scheduleLabel,
          document.createTextNode(` ${details.schedule}`)
        );

        const availabilityLabel = createTextElement("strong", "Availability:");
        availability.append(
          availabilityLabel,
          document.createTextNode(` ${spotsLeft} spots left`)
        );

        participantsContainer.className = "participants-container";
        if (details.participants.length > 0) {
          const participantsSection = document.createElement("div");
          participantsSection.className = "participants-section";
          participantsSection.appendChild(
            createTextElement("h5", "Participants:")
          );
          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";

          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const participantEmail = createTextElement(
              "span",
              email,
              "participant-email"
            );
            const deleteButton = createTextElement(
              "button",
              "Remove",
              "delete-btn"
            );
            deleteButton.type = "button";
            deleteButton.setAttribute(
              "aria-label",
              `Remove ${email} from ${name}`
            );
            deleteButton.dataset.activity = name;
            deleteButton.dataset.email = email;
            deleteButton.addEventListener("click", handleUnregister);

            participant.append(participantEmail, deleteButton);
            participantsList.appendChild(participant);
          });

          participantsSection.appendChild(participantsList);
          participantsContainer.appendChild(participantsSection);
        } else {
          const noParticipants = document.createElement("p");
          noParticipants.appendChild(
            createTextElement("em", "No participants yet")
          );
          participantsContainer.appendChild(noParticipants);
        }

        activityCard.append(
          heading,
          description,
          schedule,
          availability,
          participantsContainer
        );
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.replaceChildren(
        createTextElement(
          "p",
          "Failed to load activities. Please try again later."
        )
      );
      activitiesList.setAttribute("aria-busy", "false");
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.currentTarget;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
