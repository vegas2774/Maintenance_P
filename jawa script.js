const buildingRooms = {
  westWing: ["Room 101", "Room 102", "Room 103"],
  southWing: ["Room 201", "Room 202", "Room 203"],
  northWing: ["Room 301", "Room 302", "Room 303"],
  upperSchool: ["Class 401", "Class 402", "Class 403"],
  GFB: ["Lab 1", "Lab 2", "Lab 3"],
  WLFA: ["Studio 1", "Studio 2", "Studio 3"],
  Administration: ["Office 1", "Office 2", "Office 3"],
};

// Расширяем данные об учителях для всех комнат (кроме Administration)
const roomTeachers = {
  // Upper School
  "Class 401": {
    mainTeacher: ["John Smith", "Mary Johnson", "Robert Brown"],
    assistant: ["Alice White", "David Miller", "Emma Davis"],
  },
  "Class 402": {
    mainTeacher: ["Michael Wilson", "Sarah Lee", "James Anderson"],
    assistant: ["Laura Martin", "Peter Taylor", "Sophie Clark"],
  },
  "Class 403": {
    mainTeacher: ["William Turner", "Elizabeth Moore", "Thomas Hall"],
    assistant: ["Oliver Wright", "Grace Lewis", "Harry King"],
  },
  // West Wing
  "Room 101": {
    mainTeacher: ["Paul Adams", "Linda Wilson", "George Davis"],
    assistant: ["Kate Brown", "Mark Evans", "Lucy Taylor"],
  },
  "Room 102": {
    mainTeacher: ["Helen White", "Daniel Green", "Rachel Black"],
    assistant: ["Tom Harris", "Anna Lee", "Jack Thompson"],
  },
  "Room 103": {
    mainTeacher: ["Steve Parker", "Diana Ross", "Kevin Hart"],
    assistant: ["Mike Collins", "Julia Reed", "Chris Martin"],
  },
  // South Wing
  "Room 201": {
    mainTeacher: ["Brian Cox", "Maria Garcia", "Andrew Wilson"],
    assistant: ["Sarah Palmer", "David Chen", "Emma Watson"],
  },
  "Room 202": {
    mainTeacher: ["Frank Miller", "Sofia Rodriguez", "Peter Zhang"],
    assistant: ["Lisa Cooper", "James Wright", "Nina Patel"],
  },
  "Room 203": {
    mainTeacher: ["Alan Turing", "Marie Curie", "Isaac Newton"],
    assistant: ["Albert Einstein", "Jane Goodall", "Charles Darwin"],
  },
  // North Wing
  "Room 301": {
    mainTeacher: ["Leo Davidson", "Sophia Lee", "Marcus Johnson"],
    assistant: ["Olivia Brown", "Lucas Martinez", "Isabella Kim"],
  },
  "Room 302": {
    mainTeacher: ["Nathan Phillips", "Emily Watson", "Ryan Cooper"],
    assistant: ["Hannah Baker", "Dylan Murphy", "Victoria Chen"],
  },
  "Room 303": {
    mainTeacher: ["Benjamin Gray", "Ava Wilson", "Mason Thompson"],
    assistant: ["Ella Davis", "Owen Rodriguez", "Mia Taylor"],
  },
  // GFB Labs
  "Lab 1": {
    mainTeacher: ["Dr. Richard Feynman", "Dr. Lisa Su", "Dr. James Maxwell"],
    assistant: ["Ted Cooper", "Rose Martinez", "Alan Shepherd"],
  },
  "Lab 2": {
    mainTeacher: [
      "Dr. Marie Smith",
      "Dr. Robert Oppenheimer",
      "Dr. Niels Bohr",
    ],
    assistant: ["Carl Sagan", "Grace Hopper", "Neil Armstrong"],
  },
  "Lab 3": {
    mainTeacher: ["Dr. Stephen Hawking", "Dr. Jane Foster", "Dr. Bruce Banner"],
    assistant: ["Tony Stark", "Peter Parker", "Reed Richards"],
  },
  // WLFA Studios
  "Studio 1": {
    mainTeacher: ["Vincent van Gogh", "Frida Kahlo", "Pablo Picasso"],
    assistant: ["Claude Monet", "Georgia O'Keeffe", "Andy Warhol"],
  },
  "Studio 2": {
    mainTeacher: ["Leonardo da Vinci", "Michelangelo", "Raphael"],
    assistant: ["Salvador Dali", "Jackson Pollock", "Henri Matisse"],
  },
  "Studio 3": {
    mainTeacher: ["Gustav Klimt", "Wassily Kandinsky", "Edgar Degas"],
    assistant: ["Paul Klee", "Joan Miro", "Marc Chagall"],
  },
  // Administration
  "Office 1": {
    mainTeacher: [
      "Dr. Jennifer Adams - Principal",
      "Michael Scott - Vice Principal",
      "Sarah Johnson - Dean",
    ],
    assistant: [
      "Patricia Wilson - Secretary",
      "Robert Brown - Administrator",
      "Emily Davis - Coordinator",
    ],
  },
  "Office 2": {
    mainTeacher: [
      "David Miller - Financial Director",
      "Amanda White - HR Manager",
      "James Thompson - Operations Manager",
    ],
    assistant: [
      "Lisa Chen - Accountant",
      "Mark Wilson - HR Assistant",
      "Karen Taylor - Office Manager",
    ],
  },
  "Office 3": {
    mainTeacher: [
      "Richard Moore - Facilities Director",
      "Susan Clark - Student Affairs",
      "John Davis - IT Director",
    ],
    assistant: [
      "Tom Baker - IT Support",
      "Mary Johnson - Administrative Assistant",
      "Paul Green - Facilities Coordinator",
    ],
  },
};

// В начале файла добавим функцию для проверки текущего пользователя
async function checkCurrentUser() {
  try {
    await db.waitForDB();
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
      document.getElementById("userName").textContent = currentUser.fullName;
      document.querySelector(".user-account").style.display = "flex";
    } else {
      document.querySelector(".user-account").style.display = "none";
    }
  } catch (error) {
    console.error("Error checking current user:", error);
  }
}

// Проверяем авторизацию при загрузке страницы
document.addEventListener("DOMContentLoaded", async function () {
  try {
    await db.waitForDB();
    await checkCurrentUser(); // Добавляем проверку пользователя
    const users = await db.getAllUsers();

    if (users && users.length > 0) {
      await initializeForm();
    } else {
      console.log("No registered users found");
    }
  } catch (error) {
    console.error("Error initializing page:", error);
    alert("Error loading page. Please try again.");
  }
});

// Функция инициализации формы
async function initializeForm() {
  const buildingSelect = document.getElementById("buildingSelect");
  const roomSelection = document.getElementById("roomSelection");
  const roomSelect = document.getElementById("roomSelect");
  const teacherSelection = document.getElementById("teacherSelection");
  const mainTeacherRadio = document.getElementById("mainTeacherRadio");
  const assistantRadio = document.getElementById("assistantRadio");
  const staffSelectContainer = document.getElementById("staffSelectContainer");
  const staffSelect = document.getElementById("staffSelect");
  const requestForm = document.getElementById("requestForm");

  let selectedPriority = null;

  // Обработчик выбора здания
  buildingSelect.addEventListener("change", function () {
    const selectedBuilding = this.value;
    if (selectedBuilding) {
      roomSelection.style.display = "block";
      populateRoomSelect(selectedBuilding);
    } else {
      roomSelection.style.display = "none";
      teacherSelection.style.display = "none";
      requestForm.style.display = "none";
    }
  });

  // Обработчик выбора комнаты
  roomSelect.addEventListener("change", function () {
    if (this.value) {
      teacherSelection.style.display = "block";
      mainTeacherRadio.checked = false;
      assistantRadio.checked = false;
      staffSelectContainer.style.display = "none";
      requestForm.style.display = "none";
    } else {
      teacherSelection.style.display = "none";
      requestForm.style.display = "none";
    }
  });

  // Обработчики выбора типа сотрудника
  async function handleStaffTypeSelection() {
    const selectedRoom = roomSelect.value;
    const staffType = this.value;

    if (selectedRoom && staffType) {
      staffSelectContainer.style.display = "block";
      await populateStaffSelect(selectedRoom, staffType);
    }
  }

  mainTeacherRadio.addEventListener("change", handleStaffTypeSelection);
  assistantRadio.addEventListener("change", handleStaffTypeSelection);

  // Обработчик выбора сотрудника
  staffSelect.addEventListener("change", async function () {
    if (this.value) {
      const selectedStaff = this.value;
      const isAuthorized = await checkUserAuthorization(selectedStaff);

      if (isAuthorized) {
        requestForm.style.display = "block";
      } else {
        alert("Please register or login to submit maintenance requests.");
        window.location.href = "register.html";
      }
    } else {
      requestForm.style.display = "none";
    }
  });

  // Функция проверки авторизации пользователя
  async function checkUserAuthorization(selectedStaff) {
    try {
      await db.waitForDB(); // Дожидаемся инициализации базы данных
      const user = await db.getUserByName(selectedStaff);
      return !!user;
    } catch (error) {
      console.error("Error checking authorization:", error);
      return false;
    }
  }

  // Обработчики кнопок приоритета
  const priorityButtons = document.querySelectorAll(".priority-btn");

  priorityButtons.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault(); // Предотвращаем отправку формы
      // Убираем выделение со всех кнопок
      priorityButtons.forEach((b) => b.classList.remove("selected"));
      // Добавляем выделение на нажатую кнопку
      this.classList.add("selected");
      selectedPriority = this.dataset.priority;
    });
  });

  // Обработчик отправки формы
  document
    .getElementById("submitRequest")
    .addEventListener("click", async function (e) {
      e.preventDefault();

      if (!selectedPriority) {
        alert("Please select a priority level");
        return;
      }

      const building = buildingSelect.value;
      const room = roomSelect.value;
      const staff = staffSelect.value;
      const details = document.getElementById("requestDetails").value;

      if (!details.trim()) {
        alert("Please provide maintenance request details");
        return;
      }

      try {
        // Получаем информацию о текущем пользователе
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));

        const requestData = {
          requestId: generateRequestId(),
          building,
          room,
          staff,
          priority: selectedPriority,
          details,
          timestamp: new Date().toISOString(),
          status: "In Progress",
          assignedTo: null,
          comments: [],
          submittedBy: currentUser ? currentUser.fullName : "Anonymous",
        };

        console.log("Attempting to save task:", requestData); // Для отладки

        // Сохраняем задачу в базу данных
        const success = await db.addTask(requestData);

        if (success) {
          console.log("Task saved successfully"); // Для отладки
          // Показываем модальное окно с подтверждением
          showConfirmationModal(requestData.requestId);

          // Очищаем форму
          document.querySelector("form").reset();
          selectedPriority = null;
          document
            .querySelectorAll(".priority-btn")
            .forEach((btn) => btn.classList.remove("selected"));
        } else {
          throw new Error("Failed to save task");
        }
      } catch (error) {
        console.error("Error saving request:", error);
        alert("Error saving request. Please try again.");
      }
    });
}

// Фун��ция для генерации ID запроса
function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `REQ-${timestamp}-${random}`.toUpperCase();
}

// Функция для показа модального окна
function showConfirmationModal(requestId) {
  try {
    const modal = document.getElementById("confirmationModal");
    if (!modal) {
      console.error("Modal element not found");
      return;
    }

    const requestIdElement = document.getElementById("requestId");
    if (requestIdElement) {
      requestIdElement.textContent = requestId;
    }

    modal.style.display = "flex";
  } catch (error) {
    console.error("Error showing confirmation modal:", error);
    alert("Request saved successfully. Request ID: " + requestId);
  }
}

// Обработчик для закрытия модального окна
document.getElementById("closeModal").addEventListener("click", function () {
  document.getElementById("confirmationModal").style.display = "none";
  // Опционально: очистить форму или перезагрузить страницу
  location.reload();
});

// Закрытие модального окна при клике вне его
document
  .getElementById("confirmationModal")
  .addEventListener("click", function (e) {
    if (e.target === this) {
      this.style.display = "none";
      location.reload();
    }
  });

// Функция для заполнения списка комнат
function populateRoomSelect(building) {
  const roomSelect = document.getElementById("roomSelect");
  roomSelect.innerHTML = '<option value="">Select Room</option>';

  const rooms = buildingRooms[building] || [];
  rooms.forEach((room) => {
    const option = document.createElement("option");
    option.value = room;
    option.textContent = room;
    roomSelect.appendChild(option);
  });
}

// Функция для заполнения списка сотрудников
async function populateStaffSelect(room, staffType) {
  try {
    await db.waitForDB(); // Дожидаемся инициализации базы данных
    const staffSelect = document.getElementById("staffSelect");
    staffSelect.innerHTML = '<option value="">Select Staff Member</option>';

    if (roomTeachers[room]) {
      const staffList =
        staffType === "mainTeacher"
          ? roomTeachers[room].mainTeacher
          : roomTeachers[room].assistant;

      const registeredUsers = await db.getAllUsers();
      console.log("Registered users:", registeredUsers); // Для отладки

      const availableStaff = staffList.filter((staff) =>
        registeredUsers.some((user) => user.fullName === staff)
      );
      console.log("Available staff:", availableStaff); // Для отладки

      availableStaff.forEach((staff) => {
        const option = document.createElement("option");
        option.value = staff;
        option.textContent = staff;
        staffSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error populating staff select:", error);
  }
}

// Обновим обработчик для кнопки выхода
document
  .getElementById("logoutButton")
  .addEventListener("click", async function () {
    try {
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  });