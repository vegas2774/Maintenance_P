export default class ConstructionManager {
  constructor(container) {
    this.container = container;
    this.contractors = [];
    this.currentProjects = [];
    this.futureProjects = [];
    this.activeTab = "contractors";
    this.handleRating = this.handleRating.bind(this);
    this.filters = {
      contractors: {
        search: "",
        businessType: "all",
        rating: "all",
      },
      currentProjects: {
        search: "",
        location: "",
        status: "all",
        date: "all",
      },
      futureProjects: {
        search: "",
        location: "",
        priority: "all",
        date: "all",
      },
    };
    this.init();
  }

  init() {
    // Добавляем стили для мигрированных проектов
    if (
      typeof window.GlobalData !== "undefined" &&
      window.GlobalData &&
      window.GlobalData.MigratedProjects &&
      window.GlobalData.MigratedProjects.length
    ) {
      window.GlobalData.MigratedProjects.forEach((projectId) => {
        this.addStyleForMigratedProjects(projectId);
      });
    }

    // Создаем модальное окно для превью, если его нет
    this.ensurePreviewModalExists();

    // Проверяем наличие шаблонов для проектов
    this.checkTemplates();

    // Загружаем данные и инициализируем компоненты
    this.loadData().then(() => {
      // Инициализация всех компонентов
      this.initDatepickers();
      this.initNavigation();
      this.initEventListeners();
      this.renderActiveSection();
    });
  }

  // Метод для проверки наличия шаблонов
  checkTemplates() {
    const currentProjectTemplate = this.container.querySelector(
      "#current-project-card-template"
    );
    const futureProjectTemplate = this.container.querySelector(
      "#future-project-card-template"
    );

    if (!currentProjectTemplate) {
      console.error(
        "Current project card template not found. Some functionality may not work."
      );
    }

    if (!futureProjectTemplate) {
      console.error(
        "Future project card template not found. Some functionality may not work."
      );
    }

    // Проверяем наличие контейнеров для списков проектов
    const currentProjectsList = this.container.querySelector(
      "#current-projects-list"
    );
    const futureProjectsList = this.container.querySelector(
      "#future-projects-list"
    );

    if (!currentProjectsList) {
      console.error(
        "Current projects list container not found. Projects will not be displayed."
      );
    }

    if (!futureProjectsList) {
      console.error(
        "Future projects list container not found. Projects will not be displayed."
      );
    }
  }

  // Метод для создания модального окна для предпросмотра изображений
  ensurePreviewModalExists() {
    // Проверяем наличие модального окна
    if (!this.container.querySelector(".preview-modal")) {
      console.log("Creating preview modal window");

      // Добавляем стили для файловых превью, если их нет
      if (!document.getElementById("file-preview-styles")) {
        const previewStyles = document.createElement("style");
        previewStyles.id = "file-preview-styles";
        previewStyles.innerHTML = `
          .file-preview-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
          }
          
          .file-preview-item {
            position: relative;
            width: 100px;
            height: 120px;
            border: 1px solid #ddd;
        border-radius: 4px;
            padding: 5px;
        display: flex;
            flex-direction: column;
        align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            background-color: #f9f9f9;
            overflow: hidden;
          }
          
          .file-preview-item:hover {
            border-color: #0088cc;
            box-shadow: 0 0 5px rgba(0, 136, 204, 0.5);
          }
          
          .file-preview-item img {
            max-width: 90%;
            max-height: 70px;
            object-fit: contain;
            margin-bottom: 5px;
          }
          
          .file-type-icon {
            font-size: 2.5rem;
            color: #999;
            margin-bottom: 5px;
          }
          
          .file-name {
            font-size: 0.8rem;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }
          
          .remove-file {
            position: absolute;
            top: 2px;
            right: 2px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: #f44336;
            color: white;
            border: none;
            font-size: 14px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0.7;
          }
          
          .remove-file:hover {
            opacity: 1;
          }
          
          .preview-modal {
            z-index: 9999 !important;
          }
          
          .preview-content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
            background-color: #fff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          
          .preview-content img {
            max-width: 100%;
            max-height: 80vh;
            object-fit: contain;
          }
        `;
        document.head.appendChild(previewStyles);
      }

      // Создаем модальное окно
      const modal = document.createElement("div");
      modal.className = "preview-modal";
      modal.style.display = "none";
      modal.style.alignItems = "center";
      modal.style.justifyContent = "center";
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      modal.style.zIndex = "1000";

      // Создаем содержимое модального окна
      const previewContent = document.createElement("div");
      previewContent.className = "preview-content";
      previewContent.style.position = "relative";
      previewContent.style.maxWidth = "90%";
      previewContent.style.maxHeight = "90%";
      previewContent.style.backgroundColor = "#fff";
      previewContent.style.padding = "20px";
      previewContent.style.borderRadius = "5px";
      previewContent.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.3)";

      // Создаем кнопку закрытия
      const closeButton = document.createElement("button");
      closeButton.className = "close-preview";
      closeButton.innerHTML = "&times;";
      closeButton.style.position = "absolute";
      closeButton.style.top = "10px";
      closeButton.style.right = "10px";
      closeButton.style.backgroundColor = "#f44336";
      closeButton.style.color = "white";
      closeButton.style.border = "none";
      closeButton.style.borderRadius = "50%";
      closeButton.style.width = "30px";
      closeButton.style.height = "30px";
      closeButton.style.fontSize = "20px";
      closeButton.style.cursor = "pointer";
      closeButton.style.display = "flex";
      closeButton.style.alignItems = "center";
      closeButton.style.justifyContent = "center";

      // Создаем элемент изображения
      const previewImage = document.createElement("img");
      previewImage.style.maxWidth = "100%";
      previewImage.style.maxHeight = "80vh";
      previewImage.style.display = "block";
      previewImage.alt = "Preview";

      // Собираем модальное окно
      previewContent.appendChild(closeButton);
      previewContent.appendChild(previewImage);
      modal.appendChild(previewContent);

      // Добавляем модальное окно в контейнер
      this.container.appendChild(modal);
    }
  }

  // Добавляем стили для конкретного мигрированного проекта
  addStyleForMigratedProjects(projectId) {
    // Проверяем наличие стилей для мигрированных проектов
    if (!document.getElementById("migrated-project-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "migrated-project-styles";
      styleSheet.innerHTML = `
        .project-card.migrated-project {
          border-left: 4px solid #0088cc;
          background-color: rgba(0, 136, 204, 0.05);
          transition: height 0.3s ease, min-height 0.3s ease;
        }
        
        .migrated-flag {
        display: inline-block;
          background-color: #0088cc;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
          font-size: 12px;
        margin-left: 8px;
        }
        
        .migrated-files-group {
          border-left: 3px solid #0088cc;
          padding-left: 10px;
          margin-bottom: 20px;
          overflow: visible;
          transition: max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
        }
        
        .from-future-title {
          color: #0088cc;
          font-weight: bold;
          margin-bottom: 10px;
          display: none;
        }
        
        .migrated-separator {
          height: 1px;
          background-color: #ddd;
          margin: 20px 0;
          transition: margin 0.3s ease;
        }
        
        .current-files-title {
          color: #4CAF50;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .migrated-files {
          margin-bottom: 15px;
          position: relative;
        }
        
        .from-future-flag {
          color: #0088cc;
        font-size: 12px;
          font-weight: bold;
        }
        
        .migrated-header {
          margin-bottom: 8px;
          margin-top: 5px;
        }
        
        .migrated-files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
      `;
      document.head.appendChild(styleSheet);
    }

    console.log(`Added styles for migrated project ${projectId}`);
  }

  // Метод для инициализации datepicker для полей даты
  initDatepickers() {
    // Проверяем, доступен ли Flatpickr
    if (typeof flatpickr !== "function") {
      console.log("Loading flatpickr...");
      // Загружаем CSS
      const linkElem = document.createElement("link");
      linkElem.rel = "stylesheet";
      linkElem.href =
        "https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css";
      document.head.appendChild(linkElem);

      // Загружаем JavaScript
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/flatpickr";
      script.onload = () => {
        console.log("Flatpickr loaded successfully");
        // После загрузки библиотеки инициализируем календари для дат
        this.initDateInputs();
      };
      document.head.appendChild(script);
      return;
    }

    this.initDateInputs();
  }

  // Вспомогательный метод для инициализации полей даты
  initDateInputs() {
    const dateInputs = this.container.querySelectorAll(
      'input[name="startDate"], input[name="endDate"], input[name="lastUpdate"]'
    );

    dateInputs.forEach((input) => {
      // Удаляем существующие экземпляры flatpickr
      if (input._flatpickr) {
        input._flatpickr.destroy();
      }

      // Инициализируем flatpickr с правильными настройками
      flatpickr(input, {
        dateFormat: "m/d/Y",
        allowInput: true,
        disableMobile: true,
        appendTo: input.parentNode, // Убедимся, что календарь отображается в контексте формы
      });

      console.log(`Initialized datepicker for ${input.name}`);
    });
  }

  initNavigation() {
    // Находим все навигационные вкладки
    const navItems = this.container.querySelectorAll(".tab");

    // Добавляем обработчики событий для каждой вкладки
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        const targetSection = e.currentTarget.dataset.section;

        // Удаляем активный класс со всех вкладок и секций
        this.container.querySelectorAll(".tab").forEach((tab) => {
          tab.classList.remove("active");
        });
        this.container
          .querySelectorAll(".construction-section")
          .forEach((section) => {
            section.classList.remove("active");
          });

        // Добавляем активный класс к выбранной вкладке и секции
        e.currentTarget.classList.add("active");
        this.container
          .querySelector(`#${targetSection}`)
          .classList.add("active");

        // Обновляем заголовок в зависимости от выбранной секции
        const sectionTitle = this.container.querySelector("#section-title");
        if (sectionTitle) {
          sectionTitle.textContent =
            targetSection === "contractors-section"
              ? "Contractors"
              : targetSection === "current-projects-section"
              ? "Current Projects"
              : "Future Projects";
        }

        // Показываем соответствующие фильтры
        this.container.querySelectorAll(".filter-group").forEach((group) => {
          group.style.display = "none";
        });

        // Показываем фильтры для активной секции
        const filterGroup = this.container.querySelector(
          `#${targetSection.replace("-section", "-filters")}`
        );
        if (filterGroup) {
          filterGroup.style.display = "flex";
        }

        // Вызываем обработчик изменения секции
        this.onSectionChange(targetSection);
      });
    });

    // Устанавливаем начальную активную секцию
    const activeTab =
      this.container.querySelector(".tab.active") ||
      this.container.querySelector(".tab");
    if (activeTab) {
      activeTab.click();
    }
  }

  initEventListeners() {
    // Обработчики для контракторов
    this.container
      .querySelector("#add-contractor")
      ?.addEventListener("click", () => {
        this.showContractorModal();
      });

    // Обработчики для проектов
    this.container
      .querySelector("#add-current-project")
      ?.addEventListener("click", () => {
        this.showProjectModal("current");
      });

    this.container
      .querySelector("#add-future-project")
      ?.addEventListener("click", () => {
        this.showProjectModal("future");
      });

    // Обработчики закрытия модальных окон
    this.container
      .querySelectorAll(".close-modal, .btn-secondary.close-modal")
      .forEach((button) => {
        button.addEventListener("click", () => {
          this.closeModals();
        });
      });

    // Обработчики форм
    this.container
      .querySelector("#contractor-form")
      ?.addEventListener("submit", (e) => {
        this.handleContractorSubmit(e);
      });

    // Добавляем обработчик для формы сотрудников
    this.container
      .querySelector("#employee-form")
      ?.addEventListener("submit", (e) => {
        this.handleEmployeeSubmit(e);
      });

    // Обработчики для форм проектов
    const currentProjectForm = this.container.querySelector(
      "#current-project-form"
    );
    if (currentProjectForm) {
      currentProjectForm.addEventListener("submit", (e) => {
        this.handleProjectSubmit(e);
      });
    }

    const futureProjectForm = this.container.querySelector(
      "#future-project-form"
    );
    if (futureProjectForm) {
      futureProjectForm.addEventListener("submit", (e) => {
        this.handleProjectSubmit(e);
      });
    }

    // Обработчики для фильтров
    this.setupSearchFilters();

    // Обработчики для рейтинга
    this.setupRatingHandlers();

    // Добавляем обработчики для загрузки файлов
    this.initFileUploadHandlers();
  }

  initFileUploadHandlers() {
    // Обработчики для текущего проекта
    this.initFileUploadSection("photos", "photo");
    this.initFileUploadSection("documents", "document");
    this.initFileUploadSection("reports", "report");

    // Обработчики для будущего проекта
    this.initFileUploadSection("future-documents", "document");
    this.initFileUploadSection("future-specifications", "specification");
  }

  initFileUploadSection(inputId, fileType) {
    const input = this.container.querySelector(`#${inputId}`);
    const previewContainer = this.container.querySelector(
      `#${inputId}-preview`
    );
    const progressContainer = input
      .closest(".form-group")
      .querySelector(".upload-progress");
    const progressBar = progressContainer.querySelector(".progress-bar-fill");
    const progressText = progressContainer.querySelector(".progress-text");

    if (!input || !previewContainer) return;

    // Обработчик изменения input
    input.addEventListener("change", (e) => {
      this.handleFileSelection(
        e.target.files,
        fileType,
        previewContainer,
        progressContainer,
        progressBar,
        progressText
      );
    });

    // Обработчики drag-and-drop
    const dropZone = input.closest(".file-upload-container");
    if (dropZone) {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });

      ["dragenter", "dragover"].forEach((eventName) => {
        dropZone.addEventListener(eventName, () => {
          dropZone.classList.add("drag-over");
        });
      });

      ["dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, () => {
          dropZone.classList.remove("drag-over");
        });
      });

      dropZone.addEventListener("drop", (e) => {
        const files = e.dataTransfer.files;
        this.handleFileSelection(
          files,
          fileType,
          previewContainer,
          progressContainer,
          progressBar,
          progressText
        );
      });
    }
  }

  handleFileSelection(
    files,
    fileType,
    previewContainer,
    progressContainer,
    progressBar,
    progressText
  ) {
    if (!files || files.length === 0) return;

    // Show progress bar
    progressContainer.classList.add("active");

    // Create array for previews
    const previews = [];

    // Process each file
    Array.from(files).forEach((file, index) => {
      // Create preview object
      const preview = {
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
        category: fileType,
      };

      // Add to previews array
      previews.push(preview);

      // If it's an image, create preview
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.data = e.target.result;
          this.updateFilePreviews(previewContainer, previews);
          this.updateProgress(
            progressBar,
            progressText,
            index + 1,
            files.length
          );
        };
        reader.readAsDataURL(file);
      } else {
        // For non-images, just update preview
        this.updateFilePreviews(previewContainer, previews);
        this.updateProgress(progressBar, progressText, index + 1, files.length);
      }
    });
  }

  updateFilePreviews(container, previews) {
    if (!container || !Array.isArray(previews)) return;

    // Clear existing previews
    container.innerHTML = "";

    // Add new previews
    previews.forEach((preview) => {
      const previewItem = document.createElement("div");
      previewItem.className = "file-preview-item";
      previewItem.dataset.fileType = preview.category;
      previewItem.dataset.fileName = preview.name;
      previewItem.dataset.mimeType = preview.type;

      // Create preview content based on file type
      if (preview.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = preview.data || URL.createObjectURL(preview.file);
        img.alt = preview.name;
        previewItem.appendChild(img);
      } else {
        const icon = document.createElement("i");
        icon.className = this.getFileIconClass(preview.type);
        previewItem.appendChild(icon);
      }

      // Add file info
      const info = document.createElement("div");
      info.className = "file-info";
      info.innerHTML = `
            <span class="file-name">${preview.name}</span>
            <span class="file-size">${this.formatFileSize(preview.size)}</span>
        `;
      previewItem.appendChild(info);

      // Add remove button
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-file";
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      previewItem.appendChild(removeBtn);

      container.appendChild(previewItem);
    });

    // Bind events to new preview items
    this.bindFilePreviewEvents(container);
  }

  getFileIconClass(mimeType) {
    if (mimeType.startsWith("image/")) return "fas fa-image";
    if (mimeType === "application/pdf") return "fas fa-file-pdf";
    if (mimeType.includes("word")) return "fas fa-file-word";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "fas fa-file-excel";
    return "fas fa-file";
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  updateProgress(progressBar, progressText, current, total) {
    const percentage = (current / total) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `Uploading: ${Math.round(percentage)}%`;

    if (current === total) {
      setTimeout(() => {
        progressBar.style.width = "0%";
        progressText.textContent = "Uploading: 0%";
      }, 1000);
    }
  }

  onSectionChange(sectionId) {
    // Если секция не указана, используем активную
    if (!sectionId) {
      const activeSection = this.container.querySelector(
        ".construction-section.active"
      );
      if (activeSection) {
        sectionId = activeSection.id;
      } else {
        return;
      }
    }

    // Вызываем специфические действия для каждой секции
    if (sectionId === "contractors-section") {
      this.renderContractors();
    } else if (sectionId === "current-projects-section") {
      this.renderProjects("current");
    } else if (sectionId === "future-projects-section") {
      this.renderProjects("future");
    }

    // Update statistics for the active section
    if (sectionId === "current-projects-section") {
      this.updateProjectStatistics("current");
    } else if (sectionId === "future-projects-section") {
      this.updateProjectStatistics("future");
    }
  }

  async loadData() {
    try {
      // Here will be API calls to load data
      // For now using mock data
      await this.loadContractors();
      this.updateBusinessTypeFilter(); // Обновляем список типов бизнеса после загрузки
      await this.loadCurrentProjects();
      await this.loadFutureProjects();
      this.renderActiveSection();

      // Update statistics for both sections after loading data
      this.updateProjectStatistics("current");
      this.updateProjectStatistics("future");
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  switchTab(tab) {
    this.container
      .querySelectorAll(".construction-section")
      .forEach((s) => s.classList.remove("active"));

    // Update section title
    const sectionTitle = this.container.querySelector("#section-title");
    if (sectionTitle) {
      sectionTitle.textContent =
        tab === "contractors"
          ? "Contractors"
          : tab === "current-projects"
          ? "Current Projects"
          : "Future Projects";
    }

    // Show appropriate section
    this.container.querySelector(`#${tab}-section`).classList.add("active");

    // Update filters visibility
    const contractorsFilters = this.container.querySelector(
      "#contractors-filters"
    );
    const currentProjectsFilters = this.container.querySelector(
      "#current-projects-filters"
    );
    const futureProjectsFilters = this.container.querySelector(
      "#future-projects-filters"
    );

    if (contractorsFilters) {
      contractorsFilters.style.display =
        tab === "contractors" ? "flex" : "none";
    }
    if (currentProjectsFilters) {
      currentProjectsFilters.style.display =
        tab === "current-projects" ? "flex" : "none";
    }
    if (futureProjectsFilters) {
      futureProjectsFilters.style.display =
        tab === "future-projects" ? "flex" : "none";
    }

    // Update add buttons visibility
    const addContractorBtn = this.container.querySelector("#add-contractor");
    const addCurrentProjectBtn = this.container.querySelector(
      "#add-current-project"
    );
    const addFutureProjectBtn = this.container.querySelector(
      "#add-future-project"
    );

    if (addContractorBtn) {
      addContractorBtn.style.display = tab === "contractors" ? "block" : "none";
    }
    if (addCurrentProjectBtn) {
      addCurrentProjectBtn.style.display =
        tab === "current-projects" ? "block" : "none";
    }
    if (addFutureProjectBtn) {
      addFutureProjectBtn.style.display =
        tab === "future-projects" ? "block" : "none";
    }

    this.activeTab = tab;
    this.renderActiveSection();

    // Update project statistics when switching to project tabs
    if (tab === "current-projects") {
      this.updateProjectStatistics("current");
    } else if (tab === "future-projects") {
      this.updateProjectStatistics("future");
    }
  }

  renderActiveSection() {
    switch (this.activeTab) {
      case "contractors":
        this.renderContractors();
        break;
      case "current-projects":
        this.renderProjects("current");
        break;
      case "future-projects":
        this.renderProjects("future");
        break;
    }
  }

  // Методы для работы с подрядчиками
  async loadContractors() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Convert API format to client format
        this.contractors = result.data.map((contractor) => {
          return {
            id: parseInt(contractor.id),
            companyName: contractor.company_name,
            businessType: contractor.business_type,
            location: contractor.location || "",
            email: contractor.email || "",
            phone: contractor.phone || "",
            rating: parseInt(contractor.rating) || 0,
            contactPerson: contractor.contact_person
              ? {
                  id: parseInt(contractor.contact_person.id),
                  name: contractor.contact_person.name,
                  position: contractor.contact_person.position || "",
                  phone: contractor.contact_person.phone || "",
                  email: contractor.contact_person.email || "",
                }
              : {
                  name: "None",
                  position: "",
                  phone: "",
                  email: "",
                },
            employees: contractor.employees
              ? contractor.employees.map((emp) => ({
                  id: parseInt(emp.id),
                  fullName: emp.name,
                  position: emp.position || "",
                  phone: emp.phone || "",
                  email: emp.email || "",
                }))
              : [],
          };
        });
      } else {
        console.error("Failed to load contractors:", result.message);
        // Fallback to empty array
        this.contractors = [];
      }
    } catch (error) {
      console.error("Error loading contractors:", error);
      // Fallback to empty array on error
      this.contractors = [];
    }
  }

  renderContractors() {
    const container = this.container.querySelector("#contractors-list");
    if (!container) return;

    if (this.contractors.length === 0) {
      container.innerHTML = `
            <div class="no-contractors">
                <i class="fas fa-building"></i>
                <h3>No Contractors Yet</h3>
                <p>Click the "Add Contractor" button to add your first contractor</p>
            </div>
        `;
      return;
    }

    container.innerHTML = this.contractors
      .map(
        (contractor) => `
      <div class="contractor-card" data-id="${contractor.id}">
        <div class="contractor-header">
          <h3>${contractor.companyName}</h3>
          <div class="contractor-rating">
            ${this.generateRatingStars(contractor.rating)}
          </div>
        </div>
        <div class="contractor-info">
          <div class="info-item">
            <i class="fas fa-briefcase"></i>
            <span>${contractor.businessType}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-location-dot"></i>
            <span>${contractor.location}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.email}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.phone}</span>
          </div>
        </div>
        <div class="contact-person-info">
          <h4>Contact Person</h4>
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span>${contractor.contactPerson.name}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-id-badge"></i>
            <span>${contractor.contactPerson.position}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.contactPerson.phone}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.contactPerson.email}</span>
          </div>
        </div>
        <div class="contractor-employees">
          <h4>Employees (${contractor.employees.length})</h4>
          <div class="employees-list">
            ${this.renderEmployeesList(contractor.employees)}
          </div>
          <button class="btn-secondary add-employee" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-user-plus"></i> Add Employee
          </button>
        </div>
        <div class="contractor-actions">
          <button class="btn-action edit" data-contractor-id="${contractor.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action delete" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    // Добавляем обработчики событий после рендеринга
    this.bindEmployeeEvents();

    // Add event handlers for contractor edit and delete buttons
    this.container
      .querySelectorAll(".contractor-actions .btn-action.edit")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          const contractor = this.contractors.find(
            (c) => c.id === contractorId
          );
          if (contractor) {
            this.showContractorModal(contractor);
          }
        });
      });

    this.container
      .querySelectorAll(".contractor-actions .btn-action.delete")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          this.deleteContractor(contractorId);
        });
      });
  }

  renderEmployeesList(employees) {
    return employees
      .map(
        (employee) => `
        <div class="employee-item">
            <div class="employee-info">
                <strong>${employee.fullName}</strong>
                <span>${employee.position}</span>
                <span>${employee.phone}</span>
            </div>
            <div class="employee-actions">
                <button class="btn-action edit" data-employee-id="${employee.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" data-employee-id="${employee.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `
      )
      .join("");
  }

  bindEmployeeEvents() {
    // Обработчики для кнопок редактирования сотрудников
    this.container
      .querySelectorAll(".employee-actions .btn-action.edit")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const employeeId = parseInt(button.dataset.employeeId);
          const contractorId = parseInt(
            button.closest(".contractor-card").dataset.id
          );
          this.editEmployee(contractorId, employeeId);
        });
      });

    // Обработчики для кнопок удаления сотрудников
    this.container
      .querySelectorAll(".employee-actions .btn-action.delete")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const employeeId = parseInt(button.dataset.employeeId);
          const contractorId = parseInt(
            button.closest(".contractor-card").dataset.id
          );
          this.deleteEmployee(contractorId, employeeId);
        });
      });

    // Обработчики для кнопок добавления сотрудников
    this.container.querySelectorAll(".add-employee").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const contractorId = parseInt(button.dataset.contractorId);
        this.showEmployeeModal(contractorId);
      });
    });
  }

  showEmployeeModal(contractorId, employee = null) {
    const modal = this.container.querySelector("#employee-modal");
    const form = modal.querySelector("#employee-form");
    const title = modal.querySelector("#employee-modal-title");

    title.textContent = employee ? "Edit Employee" : "Add Employee";

    form.elements.contractorId.value = contractorId;

    if (employee) {
      form.elements.fullName.value = employee.fullName;
      form.elements.position.value = employee.position;
      form.elements.phone.value = employee.phone;
      form.dataset.employeeId = employee.id;
    } else {
      form.reset();
      form.elements.contractorId.value = contractorId;
      delete form.dataset.employeeId;
    }

    modal.classList.add("active");
  }

  editEmployee(contractorId, employeeId) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      const employee = contractor.employees.find((e) => e.id === employeeId);
      if (employee) {
        this.showEmployeeModal(contractorId, employee);
      }
    }
  }

  deleteEmployee(contractorId, employeeId) {
    if (confirm("Are you sure you want to delete this employee?")) {
      const contractor = this.contractors.find((c) => c.id === contractorId);
      if (contractor) {
        contractor.employees = contractor.employees.filter(
          (e) => e.id !== employeeId
        );
        this.renderContractors();
      }
    }
  }

  handleEmployeeSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const contractorId = parseInt(form.elements.contractorId.value);
    const employeeData = {
      fullName: form.elements.fullName.value,
      position: form.elements.position.value,
      phone: form.elements.phone.value,
    };

    if (form.dataset.employeeId) {
      // Редактирование существующего сотрудника
      const employeeId = parseInt(form.dataset.employeeId);
      this.updateEmployee(contractorId, employeeId, employeeData);
    } else {
      // Добавление нового сотрудника
      this.addEmployeeToContractor(contractorId, employeeData);
    }

    this.closeModals();
  }

  addEmployeeToContractor(contractorId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      // First add to local data structure for immediate feedback
      data.id = Date.now(); // Temporary ID
      contractor.employees.push(data);

      // Prepare data for API
      const existingEmployees = contractor.employees.filter(
        (e) => e.id !== data.id
      );

      const apiData = {
        company_name: contractor.companyName,
        business_type: contractor.businessType,
        location: contractor.location,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        notes: contractor.notes || "",
        employees: [
          ...existingEmployees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: 0,
          })),
          // Add new employee
          {
            name: data.fullName,
            position: data.position || "",
            phone: data.phone || "",
            email: data.email || "",
            is_primary_contact: 0,
          },
        ],
      };

      // Используем правильный URL API
      fetch(
        `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((responseData) => {
          if (responseData.success) {
            // Обновляем данные о сотрудниках из ответа API
            if (responseData.data && responseData.data.employees) {
              // Находим контрактор в массиве this.contractors и обновляем его сотрудников
              const updatedContractor = this.contractors.find(
                (c) => c.id === contractorId
              );
              if (updatedContractor) {
                // Преобразуем сотрудников из формата API в формат UI
                updatedContractor.employees = responseData.data.employees.map(
                  (emp) => ({
                    id: parseInt(emp.id),
                    fullName: emp.name,
                    position: emp.position || "",
                    phone: emp.phone || "",
                    email: emp.email || "",
                  })
                );
              }
            }

            // Перерисовываем UI для отображения обновленных данных
            this.renderContractors();
          } else {
            console.error("Error adding employee:", responseData.message);
            alert("Failed to add employee: " + responseData.message);
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          }
        })
        .catch((error) => {
          console.error("Error adding employee:", error);
          alert("Failed to add employee. Please try again.");
          // Обновляем данные с сервера в случае ошибки
          this.loadContractors().then(() => this.renderContractors());
        });

      // Render immediately for responsive UI
      this.renderContractors();
    }
  }

  updateEmployee(contractorId, employeeId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      const index = contractor.employees.findIndex((e) => e.id === employeeId);
      if (index !== -1) {
        // Update local data first
        contractor.employees[index] = {
          ...contractor.employees[index],
          ...data,
        };

        // Prepare data for API
        const apiData = {
          company_name: contractor.companyName,
          business_type: contractor.businessType,
          location: contractor.location,
          email: contractor.email,
          phone: contractor.phone,
          rating: contractor.rating,
          notes: contractor.notes || "",
          employees: contractor.employees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: e.isPrimaryContact ? 1 : 0,
          })),
        };

        // Используем правильный URL API
        fetch(
          `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiData),
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((responseData) => {
            if (responseData.success) {
              // Обновляем данные о сотрудниках из ответа API
              if (responseData.data && responseData.data.employees) {
                // Находим контрактор в массиве this.contractors и обновляем его сотрудников
                const updatedContractor = this.contractors.find(
                  (c) => c.id === contractorId
                );
                if (updatedContractor) {
                  // Преобразуем сотрудников из формата API в формат UI
                  updatedContractor.employees = responseData.data.employees.map(
                    (emp) => ({
                      id: parseInt(emp.id),
                      fullName: emp.name,
                      position: emp.position || "",
                      phone: emp.phone || "",
                      email: emp.email || "",
                    })
                  );
                }
              }

              // Перерисовываем UI для отображения обновленных данных
              this.renderContractors();
            } else {
              console.error("Error updating employee:", responseData.message);
              alert("Failed to update employee: " + responseData.message);
              // Обновляем данные с сервера в случае ошибки
              this.loadContractors().then(() => this.renderContractors());
            }
          })
          .catch((error) => {
            console.error("Error updating employee:", error);
            alert("Failed to update employee. Please try again.");
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          });

        // Render immediately for UI feedback
        this.renderContractors();
      }
    }
  }

  // Методы для работы с проектами
  async loadCurrentProjects() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?type=current"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Преобразуем свойства для совместимости с существующим кодом
        this.currentProjects = data.data.map((project) => ({
          id: project.id,
          name: project.name,
          location: project.location,
          startDate: project.start_date,
          endDate: project.end_date,
          businessType: project.business_type,
          contractorId: project.contractor_id,
          contractorName: project.contractor_name,
          contactPersonId: project.contact_person_id,
          contactPersonName: project.contact_person_name,
          status: project.status,
          progress: project.progress,
          actualCost: project.actual_cost,
          lastUpdate: project.last_update,
          files: project.files || [],
        }));
      } else {
        console.error("Error loading current projects:", data.message);
        this.currentProjects = [];
      }
    } catch (error) {
      console.error("Error loading current projects:", error);
      this.currentProjects = [];
    }
  }

  async loadFutureProjects() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?type=future"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Преобразуем свойства для совместимости с существующим кодом
        this.futureProjects = data.data.map((project) => ({
          id: project.id,
          name: project.name,
          location: project.location,
          startDate: project.start_date,
          endDate: project.end_date,
          businessType: project.business_type,
          contractorId: project.contractor_id,
          contractorName: project.contractor_name,
          contactPersonId: project.contact_person_id,
          contactPersonName: project.contact_person_name,
          status: project.status,
          budget: project.budget,
          priority: project.priority,
          description: project.description,
          objectives: project.objectives,
          risks: project.risks,
          files: project.files || [],
        }));
      } else {
        console.error("Error loading future projects:", data.message);
        this.futureProjects = [];
      }
    } catch (error) {
      console.error("Error loading future projects:", error);
      this.futureProjects = [];
    }
  }

  // Метод для организации файлов проекта по категориям
  organizeProjectFiles(project) {
    if (!project) return project;
    if (!project.files) {
      project.files = [];
    }

    if (!Array.isArray(project.files)) {
      console.error("Files is not an array:", project.files);
      project.files = [];
    }

    console.log(
      `Organizing files for project ${project.id} Files count: ${project.files.length}`
    );

    // Копируем проект, чтобы не изменять оригинал
    const organizedProject = { ...project };

    // Организуем файлы по категориям
    organizedProject.photos = [];
    organizedProject.documents = [];
    organizedProject.reports = [];
    organizedProject.specifications = [];
    organizedProject.budgetDocs = [];

    project.files.forEach((file) => {
      // Ensure file has all necessary properties
      const processedFile = {
        ...file,
        id: file.id || file.fileId || "",
        fileId: file.id || file.fileId || "",
        fileName:
          file.file_name ||
          file.fileName ||
          file.original_name ||
          "Unknown file",
        original_name:
          file.original_name || file.fileName || file.file_name || "",
        filePath: file.file_path || file.filePath || "",
        file_path: file.file_path || file.filePath || "",
        miniPath: file.mini_path || file.miniPath || "",
        mini_path: file.mini_path || file.miniPath || "",
        mimeType: file.mime_type || file.mimeType || "",
        mime_type: file.mime_type || file.mimeType || "",
        fileCategory:
          file.file_category ||
          file.fileCategory ||
          file.category ||
          "document",
      };

      const category = processedFile.fileCategory.toLowerCase();

      if (category === "photo") {
        organizedProject.photos.push(processedFile);
      } else if (category === "document") {
        organizedProject.documents.push(processedFile);
      } else if (category === "report") {
        organizedProject.reports.push(processedFile);
      } else if (category === "specification") {
        organizedProject.specifications.push(processedFile);
      } else if (category === "budget") {
        organizedProject.budgetDocs.push(processedFile);
      } else {
        // Если категория неизвестна, добавляем в документы
        organizedProject.documents.push(processedFile);
      }
    });

    console.log(`Organized files for project ${project.id}`, {
      photos: organizedProject.photos.length,
      documents: organizedProject.documents.length,
      reports: organizedProject.reports.length,
      specifications: organizedProject.specifications.length,
      budgetDocs: organizedProject.budgetDocs.length,
    });

    return organizedProject;
  }

  // Изменим метод renderProjects, чтобы использовать organizeProjectFiles
  renderProjects(type, projectsToRender = null) {
    const projects =
      projectsToRender ||
      (type === "current" ? this.currentProjects : this.futureProjects);
    const container = this.container.querySelector(`#${type}-projects-list`);

    if (!container) {
      console.error(`Container #${type}-projects-list not found`);
      return;
    }

    console.log(`Rendering ${type} projects:`, projects);
    container.innerHTML = "";

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>No projects found</p>
        </div>
      `;

      // Update statistics even if no projects are found
      this.updateProjectStatistics(type);
      return;
    }

    projects.forEach((project) => {
      // Организуем файлы проекта по категориям
      const organizedProject = this.organizeProjectFiles(project);

      const contractor = this.contractors.find(
        (c) => c.id === organizedProject.contractorId
      );
      const template = this.container.querySelector(
        `#${type}-project-card-template`
      );

      if (!template) {
        console.error(`Template #${type}-project-card-template not found`);
        return;
      }

      const card = template.content.cloneNode(true);

      // Set project ID
      const projectCard = card.querySelector(".project-card");
      projectCard.dataset.id = organizedProject.id;

      // Set project name and status
      card.querySelector(".project-name").textContent = organizedProject.name;
      const statusSelect = card.querySelector(".status-select");
      statusSelect.value = organizedProject.status;

      // Добавляем data-атрибут для привязки к проекту
      statusSelect.setAttribute("data-project-id", organizedProject.id);

      // Обновляем классы статуса
      this.updateStatusClasses(statusSelect, organizedProject.status);

      // Set project details
      card.querySelector(".location").textContent = organizedProject.location;

      // Форматируем даты для отображения
      const startDateFormatted = this.formatDateForDisplay(
        organizedProject.startDate
      );
      const endDateFormatted = this.formatDateForDisplay(
        organizedProject.endDate
      );
      card.querySelector(
        ".dates"
      ).textContent = `${startDateFormatted} - ${endDateFormatted}`;

      if (type === "current") {
        this.renderCurrentProjectDetails(card, organizedProject, contractor);
      } else {
        this.renderFutureProjectDetails(card, organizedProject, contractor);
      }

      // Добавляем карточку в контейнер
      container.appendChild(card);
    });

    // After rendering all projects, update the statistics
    this.updateProjectStatistics(type);

    // Bind events to project cards
    this.bindProjectCardEvents(type);

    // Привязываем события к предпросмотрам файлов
    this.bindFilePreviewEvents();

    // Добавим дополнительную логику для обработки всех изображений на странице
    this.enhanceAllImagePreviews(type);
  }

  // Метод для улучшения всех превью изображений в указанной секции
  enhanceAllImagePreviews(type) {
    // Получаем контейнер для секции
    const sectionId =
      type === "current"
        ? "current-projects-section"
        : "future-projects-section";
    const section = this.container.querySelector(`#${sectionId}`);
    if (!section) return;

    // Находим все изображения в секции
    const images = section.querySelectorAll(".file-preview-container img");
    images.forEach((img) => {
      // Проверяем, что у изображения есть src
      const src = img.getAttribute("src");
      if (src) {
        // Делаем курсор указателем
        img.style.cursor = "pointer";

        // Удаляем старые обработчики, чтобы избежать дублирования
        const newImg = img.cloneNode(true);
        img.parentNode.replaceChild(newImg, img);

        // Добавляем обработчик клика
        newImg.addEventListener("click", () => {
          console.log("Image clicked:", src);
          this.showImageModal(src);
        });
      }
    });

    console.log(`Enhanced ${images.length} images in ${type} projects section`);
  }

  updateStatusClasses(statusSelect, status) {
    // Удаляем все существующие классы статуса
    statusSelect.classList.remove(
      "planned",
      "in-progress",
      "completed",
      "on-hold",
      "move-to-current",
      "delayed",
      "design-phase", // Добавляем новые возможные статусы
      "planning"
    );

    // Преобразуем статус для использования в качестве CSS класса (заменяем пробелы на дефисы)
    const statusClass = status.replace(/\s+/g, "-").toLowerCase();

    // Добавляем новый класс статуса
    statusSelect.classList.add(statusClass);

    // Сбрасываем inline стили, которые могли быть установлены ранее
    statusSelect.style.backgroundColor = "";
    statusSelect.style.color = "";
    statusSelect.style.borderColor = "";

    // Определяем цвета в зависимости от статуса
    let colors = {
      planned: {
        bg: "#e3f2fd",
        color: "#1976d2",
        border: "#90caf9",
      },
      "in-progress": {
        bg: "#fff3e0",
        color: "#f57c00",
        border: "#ffcc80",
      },
      completed: {
        bg: "#e8f5e9",
        color: "#388e3c",
        border: "#a5d6a7",
      },
      "on-hold": {
        bg: "#ffebee",
        color: "#d32f2f",
        border: "#ef9a9a",
      },
      "move-to-current": {
        bg: "#f3e5f5",
        color: "#7b1fa2",
        border: "#ce93d8",
      },
      delayed: {
        bg: "#ffebee",
        color: "#d32f2f",
        border: "#ef9a9a",
      },
      "design-phase": {
        // Добавляем новые статусы с цветами
        bg: "#e0f7fa",
        color: "#0097a7",
        border: "#80deea",
      },
      planning: {
        bg: "#f3e5f5",
        color: "#8e24aa",
        border: "#ce93d8",
      },
    };

    // Пробуем найти цвета для статуса напрямую или для его CSS версии
    let colorConfig = colors[status] || colors[statusClass];

    // Применяем стили, если статус найден в нашем объекте
    if (colorConfig) {
      statusSelect.style.backgroundColor = colorConfig.bg;
      statusSelect.style.color = colorConfig.color;
      statusSelect.style.borderColor = colorConfig.border;
      statusSelect.style.borderWidth = "1px";
      statusSelect.style.borderStyle = "solid";
    } else {
      // Если статус неизвестен, применяем стандартные стили
      statusSelect.style.backgroundColor = "#f5f5f5";
      statusSelect.style.color = "#616161";
      statusSelect.style.borderColor = "#bdbdbd";
      statusSelect.style.borderWidth = "1px";
      statusSelect.style.borderStyle = "solid";
    }

    // Устанавливаем data-атрибут для дополнительной поддержки селекторов
    statusSelect.setAttribute("data-status", status);
  }

  // Helper method to update card size after toggle
  updateCardSize(card) {
    // Ensure card is a DOM element
    if (!card || typeof card.closest !== "function") {
      // If card is not a DOM element, try to find the project card differently
      // This handles cases where 'card' might be the project card body or another element
      const projectCard = card.parentElement
        ? card.parentElement.closest(".project-card")
        : document.querySelector(".project-card");

      if (projectCard) {
        // Set height to auto to let it resize naturally
        projectCard.style.height = "auto";
        const cardBody = projectCard.querySelector(".card-body");
        if (cardBody) {
          cardBody.style.height = "auto";
        }
      }
      return;
    }

    // Regular handling if card is a DOM element with closest method
    const projectCard = card.closest(".project-card");
    if (projectCard) {
      // Ensure card body expands/contracts with content
      const cardBody = projectCard.querySelector(".card-body");
      if (cardBody) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          // Reset any fixed heights
          cardBody.style.height = "";
          projectCard.style.height = "";

          // Calculate and set new height
          const height = cardBody.scrollHeight;
          cardBody.style.height = height + "px";

          // Allow height to adjust naturally after initial animation
          setTimeout(() => {
            cardBody.style.height = "auto";
          }, 300);
        }, 10);
      }
    }
  }

  renderCurrentProjectDetails(card, project, contractor) {
    // Set current project specific details
    card.querySelector(".progress").textContent = project.progress
      ? `${project.progress}%`
      : "Not started";
    card.querySelector(".actual-cost").textContent = project.actualCost
      ? `$${project.actualCost.toLocaleString()}`
      : "Not specified";
    card.querySelector(".contractor").textContent = contractor
      ? contractor.companyName
      : "Not assigned";
    card.querySelector(".project-manager").textContent =
      contractor && contractor.contactPerson
        ? `${contractor.contactPerson.name} (${contractor.contactPerson.position})`
        : "Not assigned";

    // Форматируем дату последнего обновления
    const lastUpdateFormatted = project.lastUpdate
      ? this.formatDateForDisplay(project.lastUpdate)
      : "Not updated";
    card.querySelector(".last-update").textContent = lastUpdateFormatted;

    // Определяем, является ли проект перенесенным из Future в Current
    const isMigratedProject =
      project.description ||
      project.objectives ||
      project.risks ||
      project.priority ||
      (project.specifications && project.specifications.length > 0) ||
      (project.budgetDocs && project.budgetDocs.length > 0) ||
      (project.documents &&
        project.documents.length > 0 &&
        project.migratedFromFuture);

    const detailsSection = card.querySelector(".project-details");

    // Make Project Documents header collapsible
    const documentsSection = detailsSection.querySelector(
      ".details-section:last-child"
    );
    const docHeader = documentsSection.querySelector("h4");

    // Make header collapsible
    docHeader.classList.add("collapsible-header");
    const documentsGrid = documentsSection.querySelector(".documents-grid");
    documentsGrid.classList.add("collapsible-content");

    // Add click event to toggle
    docHeader.addEventListener("click", (e) => {
      e.preventDefault();
      docHeader.classList.toggle("collapsed");
      documentsGrid.classList.toggle("collapsed");

      // Update card size after toggle - pass the project card element
      this.updateCardSize(docHeader.closest(".project-card"));
    });

    // Reorganize documents grid - group migrated files at the top
    if (isMigratedProject) {
      // Clear existing content
      documentsGrid.innerHTML = "";

      // Add a collapsible header for migrated files
      const migratedHeader = document.createElement("div");
      migratedHeader.className = "section-header";
      migratedHeader.innerHTML = `
        <h4 class="toggle-documents">
          <i class="fas fa-chevron-down"></i> 
          <span class="from-future-flag">From Future Project</span>
        </h4>
      `;
      documentsGrid.appendChild(migratedHeader);

      // Create migrated files group
      const migratedFilesGroup = document.createElement("div");
      migratedFilesGroup.className = "migrated-files-group documents-content";
      documentsGrid.appendChild(migratedFilesGroup);

      // Make sure content is fully visible with scrolling if needed
      migratedFilesGroup.style.overflowY = "visible";
      migratedFilesGroup.style.maxHeight = "none";
      documentsGrid.style.overflowY = "visible";

      // Add Planning Documents (formerly called Documents in Future Projects) if they exist
      if (
        project.documents &&
        project.documents.length > 0 &&
        project.migratedFromFuture
      ) {
        const planningDocsGroup = document.createElement("div");
        planningDocsGroup.className = "documents-group migrated-files";
        planningDocsGroup.innerHTML = `
          <h5>Planning Documents</h5>
          <div class="planning-docs-preview file-preview-container">
            ${this.renderFilePreviews(project.documents, "document")}
          </div>
        `;
        migratedFilesGroup.appendChild(planningDocsGroup);
      }

      // Add specifications if they exist
      if (project.specifications && project.specifications.length > 0) {
        const specificationsGroup = document.createElement("div");
        specificationsGroup.className = "documents-group migrated-files";
        specificationsGroup.innerHTML = `
          <h5>Specifications</h5>
          <div class="specifications-preview file-preview-container">
            ${this.renderFilePreviews(project.specifications, "specification")}
          </div>
        `;
        migratedFilesGroup.appendChild(specificationsGroup);
      }

      // Add budget documents if they exist
      if (project.budgetDocs && project.budgetDocs.length > 0) {
        const budgetDocsGroup = document.createElement("div");
        budgetDocsGroup.className = "documents-group migrated-files";
        budgetDocsGroup.innerHTML = `
          <h5>Budget Documents</h5>
          <div class="budget-docs-preview file-preview-container">
            ${this.renderFilePreviews(project.budgetDocs, "budgetDoc")}
          </div>
        `;
        migratedFilesGroup.appendChild(budgetDocsGroup);
      }

      // Add a collapsible header for current files
      const currentHeader = document.createElement("div");
      currentHeader.className = "section-header";
      currentHeader.innerHTML = `
        <h4 class="toggle-documents">
          <i class="fas fa-chevron-down"></i> 
          <span class="current-files-title">Current Project Files</span>
        </h4>
      `;
      documentsGrid.appendChild(currentHeader);

      // Create current files group
      const currentFilesGroup = document.createElement("div");
      currentFilesGroup.className = "current-files-group documents-content";
      documentsGrid.appendChild(currentFilesGroup);

      // Add current files (Photos, Reports)
      // Photos
      if (project.photos && project.photos.length > 0) {
        const photosGroup = document.createElement("div");
        photosGroup.className = "documents-group";
        photosGroup.innerHTML = `
          <h5>Photos</h5>
          <div class="photos-preview file-preview-container">
            ${this.renderFilePreviews(project.photos, "photo")}
          </div>
        `;
        currentFilesGroup.appendChild(photosGroup);
      } else {
        const photosGroup = document.createElement("div");
        photosGroup.className = "documents-group";
        photosGroup.innerHTML = `
          <h5>Photos</h5>
          <div class="photos-preview file-preview-container"></div>
        `;
        currentFilesGroup.appendChild(photosGroup);
      }

      // Reports
      if (project.reports && project.reports.length > 0) {
        const reportsGroup = document.createElement("div");
        reportsGroup.className = "documents-group";
        reportsGroup.innerHTML = `
          <h5>Reports</h5>
          <div class="reports-preview file-preview-container">
            ${this.renderFilePreviews(project.reports, "report")}
          </div>
        `;
        currentFilesGroup.appendChild(reportsGroup);
      } else {
        const reportsGroup = document.createElement("div");
        reportsGroup.className = "documents-group";
        reportsGroup.innerHTML = `
          <h5>Reports</h5>
          <div class="reports-preview file-preview-container"></div>
        `;
        currentFilesGroup.appendChild(reportsGroup);
      }

      // Add toggle functionality for each section individually
      const toggleSections = card.querySelectorAll(".toggle-documents");
      toggleSections.forEach((toggle) => {
        toggle.addEventListener("click", (e) => {
          const content = toggle.closest(".section-header").nextElementSibling;
          content.classList.toggle("collapsed");
          const icon = toggle.querySelector("i");
          icon.classList.toggle("fa-chevron-down");
          icon.classList.toggle("fa-chevron-right");

          // Update card size after toggle
          this.updateCardSize(toggle.closest(".project-card"));
        });
      });
    } else {
      // Just set file previews without reorganization
      if (project.photos && project.photos.length > 0) {
        card.querySelector(".photos-preview").innerHTML =
          this.renderFilePreviews(project.photos, "photo");
      }
      if (project.documents && project.documents.length > 0) {
        card.querySelector(".documents-preview").innerHTML =
          this.renderFilePreviews(project.documents, "document");
      }
      if (project.reports && project.reports.length > 0) {
        card.querySelector(".reports-preview").innerHTML =
          this.renderFilePreviews(project.reports, "report");
      }
    }
  }

  renderFutureProjectDetails(card, project, contractor) {
    // Future project specific details
    card.querySelector(".budget").textContent = project.budget
      ? `$${project.budget.toLocaleString()}`
      : "Not specified";
    card.querySelector(".priority").textContent = project.priority
      ? project.priority.charAt(0).toUpperCase() + project.priority.slice(1)
      : "Not specified";
    card.querySelector(".preferred-contractor").textContent = contractor
      ? contractor.companyName
      : "Not assigned";
    card.querySelector(".project-manager").textContent =
      contractor && contractor.contactPerson
        ? `${contractor.contactPerson.name} (${contractor.contactPerson.position})`
        : "Not assigned";

    // Set planning details
    card.querySelector(".description").textContent =
      project.description || "No description available";
    card.querySelector(".objectives").textContent =
      project.objectives || "No objectives defined";
    card.querySelector(".risks").textContent =
      project.risks || "No risks identified";

    // Make Project Documents header collapsible
    const detailsSection = card.querySelector(".project-details");
    const documentsSection = detailsSection.querySelector(
      ".details-section:last-child"
    );
    const docHeader = documentsSection.querySelector("h4");

    // Make header collapsible
    docHeader.classList.add("collapsible-header");
    const documentsGrid = documentsSection.querySelector(".documents-grid");
    documentsGrid.classList.add("collapsible-content");

    // Add click event to toggle
    docHeader.addEventListener("click", (e) => {
      e.preventDefault();
      docHeader.classList.toggle("collapsed");
      documentsGrid.classList.toggle("collapsed");

      // Update card size after toggle
      this.updateCardSize(card);
    });

    // Set file previews
    if (project.documents && project.documents.length > 0) {
      card.querySelector(".documents-preview").innerHTML =
        this.renderFilePreviews(project.documents, "document");
    }
    if (project.specifications && project.specifications.length > 0) {
      card.querySelector(".specifications-preview").innerHTML =
        this.renderFilePreviews(project.specifications, "specification");
    }
  }

  renderFilePreviews(files, type) {
    // Проверяем, что files - это массив
    if (!files || !Array.isArray(files) || files.length === 0) {
      return "";
    }

    console.log(`Rendering file previews for ${type}:`, files);

    // Капитализируем тип для отображения
    const displayType = type.charAt(0).toUpperCase() + type.slice(1);

    // Генерируем HTML для каждого файла
    const previewsHtml = files
      .map((file) => {
        if (!file) return "";

        // Извлекаем необходимые свойства из файла
        const fileName =
          file.fileName ||
          file.original_name ||
          file.name ||
          file.file_name ||
          "Unknown file";
        let filePath = file.filePath || file.file_path || "";
        let miniPath = file.miniPath || file.mini_path || "";
        const fileId = file.fileId || file.id || "";
        const mimeType =
          file.mimeType || file.mime_type || file.type || file.file_type || "";
        const fileSize = file.fileSize || file.file_size || file.size || 0;

        // Проверяем, является ли путь относительным, и если да, добавляем базовый путь
        if (
          filePath &&
          !filePath.startsWith("http") &&
          !filePath.startsWith("/")
        ) {
          filePath = `/Maintenance_P/Inspections-Checklist-Portal/components/construction/${filePath}`;
        } else if (
          filePath &&
          !filePath.startsWith("http") &&
          !filePath.startsWith("/Maintenance_P")
        ) {
          filePath = `/Maintenance_P${filePath}`;
        }

        if (
          miniPath &&
          !miniPath.startsWith("http") &&
          !miniPath.startsWith("/")
        ) {
          miniPath = `/Maintenance_P/Inspections-Checklist-Portal/components/construction/${miniPath}`;
        } else if (
          miniPath &&
          !miniPath.startsWith("http") &&
          !miniPath.startsWith("/Maintenance_P")
        ) {
          miniPath = `/Maintenance_P${miniPath}`;
        }

        // Определяем, является ли файл изображением
        const isImage = mimeType && mimeType.startsWith("image/");

        // Определяем класс иконки для не-изображений
        let iconClass = "fas fa-file";
        if (!isImage) {
          if (mimeType.includes("pdf")) {
            iconClass = "fas fa-file-pdf";
          } else if (
            mimeType.includes("word") ||
            mimeType.includes("document")
          ) {
            iconClass = "fas fa-file-word";
          } else if (
            mimeType.includes("excel") ||
            mimeType.includes("spreadsheet")
          ) {
            iconClass = "fas fa-file-excel";
          } else if (
            mimeType.includes("powerpoint") ||
            mimeType.includes("presentation")
          ) {
            iconClass = "fas fa-file-powerpoint";
          } else if (mimeType.includes("text")) {
            iconClass = "fas fa-file-alt";
          } else if (mimeType.includes("zip") || mimeType.includes("archive")) {
            iconClass = "fas fa-file-archive";
          }
        }

        // Строим HTML для превью файла
        return `
        <div class="file-preview-item" 
             data-file-id="${fileId}" 
             data-file-path="${filePath}" 
             data-mime-type="${mimeType}">
          ${
            isImage
              ? `<img src="${miniPath || filePath}" alt="${fileName}" />`
              : `<i class="${iconClass} file-type-icon"></i>`
          }
          <div class="file-info">
            <span class="file-name" title="${fileName}">${fileName}</span>
            ${
              fileSize
                ? `<span class="file-size">${this.formatFileSize(
                    fileSize
                  )}</span>`
                : ""
            }
          </div>
          <button class="file-action-btn view-file" title="View file">
            <i class="fas fa-eye"></i>
          </button>
          <button class="file-action-btn remove-file" title="Remove file">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      })
      .join("");

    return previewsHtml;
  }

  // Helper method to get the appropriate icon class based on file MIME type
  getFileIconClass(mimeType) {
    if (!mimeType) return "fas fa-file";

    if (mimeType.startsWith("image/")) return "fas fa-file-image";
    if (mimeType === "application/pdf") return "fas fa-file-pdf";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "fas fa-file-word";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "fas fa-file-excel";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return "fas fa-file-powerpoint";
    if (mimeType.includes("text/")) return "fas fa-file-alt";
    if (mimeType.includes("zip") || mimeType.includes("compressed"))
      return "fas fa-file-archive";

    return "fas fa-file";
  }

  formatFileSize(bytes) {
    if (!bytes) return "";

    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  updateProgress(progressBar, progressText, current, total) {
    const percentage = (current / total) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `Uploading: ${Math.round(percentage)}%`;

    if (current === total) {
      setTimeout(() => {
        progressBar.style.width = "0%";
        progressText.textContent = "Uploading: 0%";
      }, 1000);
    }
  }

  onSectionChange(sectionId) {
    // Если секция не указана, используем активную
    if (!sectionId) {
      const activeSection = this.container.querySelector(
        ".construction-section.active"
      );
      if (activeSection) {
        sectionId = activeSection.id;
      } else {
        return;
      }
    }

    // Вызываем специфические действия для каждой секции
    if (sectionId === "contractors-section") {
      this.renderContractors();
    } else if (sectionId === "current-projects-section") {
      this.renderProjects("current");
    } else if (sectionId === "future-projects-section") {
      this.renderProjects("future");
    }

    // Update statistics for the active section
    if (sectionId === "current-projects-section") {
      this.updateProjectStatistics("current");
    } else if (sectionId === "future-projects-section") {
      this.updateProjectStatistics("future");
    }
  }

  async loadData() {
    try {
      // Here will be API calls to load data
      // For now using mock data
      await this.loadContractors();
      this.updateBusinessTypeFilter(); // Обновляем список типов бизнеса после загрузки
      await this.loadCurrentProjects();
      await this.loadFutureProjects();
      this.renderActiveSection();

      // Update statistics for both sections after loading data
      this.updateProjectStatistics("current");
      this.updateProjectStatistics("future");
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  switchTab(tab) {
    this.container
      .querySelectorAll(".construction-section")
      .forEach((s) => s.classList.remove("active"));

    // Update section title
    const sectionTitle = this.container.querySelector("#section-title");
    if (sectionTitle) {
      sectionTitle.textContent =
        tab === "contractors"
          ? "Contractors"
          : tab === "current-projects"
          ? "Current Projects"
          : "Future Projects";
    }

    // Show appropriate section
    this.container.querySelector(`#${tab}-section`).classList.add("active");

    // Update filters visibility
    const contractorsFilters = this.container.querySelector(
      "#contractors-filters"
    );
    const currentProjectsFilters = this.container.querySelector(
      "#current-projects-filters"
    );
    const futureProjectsFilters = this.container.querySelector(
      "#future-projects-filters"
    );

    if (contractorsFilters) {
      contractorsFilters.style.display =
        tab === "contractors" ? "flex" : "none";
    }
    if (currentProjectsFilters) {
      currentProjectsFilters.style.display =
        tab === "current-projects" ? "flex" : "none";
    }
    if (futureProjectsFilters) {
      futureProjectsFilters.style.display =
        tab === "future-projects" ? "flex" : "none";
    }

    // Update add buttons visibility
    const addContractorBtn = this.container.querySelector("#add-contractor");
    const addCurrentProjectBtn = this.container.querySelector(
      "#add-current-project"
    );
    const addFutureProjectBtn = this.container.querySelector(
      "#add-future-project"
    );

    if (addContractorBtn) {
      addContractorBtn.style.display = tab === "contractors" ? "block" : "none";
    }
    if (addCurrentProjectBtn) {
      addCurrentProjectBtn.style.display =
        tab === "current-projects" ? "block" : "none";
    }
    if (addFutureProjectBtn) {
      addFutureProjectBtn.style.display =
        tab === "future-projects" ? "block" : "none";
    }

    this.activeTab = tab;
    this.renderActiveSection();

    // Update project statistics when switching to project tabs
    if (tab === "current-projects") {
      this.updateProjectStatistics("current");
    } else if (tab === "future-projects") {
      this.updateProjectStatistics("future");
    }
  }

  renderActiveSection() {
    switch (this.activeTab) {
      case "contractors":
        this.renderContractors();
        break;
      case "current-projects":
        this.renderProjects("current");
        break;
      case "future-projects":
        this.renderProjects("future");
        break;
    }
  }

  // Методы для работы с подрядчиками
  async loadContractors() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Convert API format to client format
        this.contractors = result.data.map((contractor) => {
          return {
            id: parseInt(contractor.id),
            companyName: contractor.company_name,
            businessType: contractor.business_type,
            location: contractor.location || "",
            email: contractor.email || "",
            phone: contractor.phone || "",
            rating: parseInt(contractor.rating) || 0,
            contactPerson: contractor.contact_person
              ? {
                  id: parseInt(contractor.contact_person.id),
                  name: contractor.contact_person.name,
                  position: contractor.contact_person.position || "",
                  phone: contractor.contact_person.phone || "",
                  email: contractor.contact_person.email || "",
                }
              : {
                  name: "None",
                  position: "",
                  phone: "",
                  email: "",
                },
            employees: contractor.employees
              ? contractor.employees.map((emp) => ({
                  id: parseInt(emp.id),
                  fullName: emp.name,
                  position: emp.position || "",
                  phone: emp.phone || "",
                  email: emp.email || "",
                }))
              : [],
          };
        });
      } else {
        console.error("Failed to load contractors:", result.message);
        // Fallback to empty array
        this.contractors = [];
      }
    } catch (error) {
      console.error("Error loading contractors:", error);
      // Fallback to empty array on error
      this.contractors = [];
    }
  }

  renderContractors() {
    const container = this.container.querySelector("#contractors-list");
    if (!container) return;

    if (this.contractors.length === 0) {
      container.innerHTML = `
            <div class="no-contractors">
                <i class="fas fa-building"></i>
                <h3>No Contractors Yet</h3>
                <p>Click the "Add Contractor" button to add your first contractor</p>
            </div>
        `;
      return;
    }

    container.innerHTML = this.contractors
      .map(
        (contractor) => `
      <div class="contractor-card" data-id="${contractor.id}">
        <div class="contractor-header">
          <h3>${contractor.companyName}</h3>
          <div class="contractor-rating">
            ${this.generateRatingStars(contractor.rating)}
          </div>
        </div>
        <div class="contractor-info">
          <div class="info-item">
            <i class="fas fa-briefcase"></i>
            <span>${contractor.businessType}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-location-dot"></i>
            <span>${contractor.location}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.email}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.phone}</span>
          </div>
        </div>
        <div class="contact-person-info">
          <h4>Contact Person</h4>
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span>${contractor.contactPerson.name}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-id-badge"></i>
            <span>${contractor.contactPerson.position}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.contactPerson.phone}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.contactPerson.email}</span>
          </div>
        </div>
        <div class="contractor-employees">
          <h4>Employees (${contractor.employees.length})</h4>
          <div class="employees-list">
            ${this.renderEmployeesList(contractor.employees)}
          </div>
          <button class="btn-secondary add-employee" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-user-plus"></i> Add Employee
          </button>
        </div>
        <div class="contractor-actions">
          <button class="btn-action edit" data-contractor-id="${contractor.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action delete" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    // Добавляем обработчики событий после рендеринга
    this.bindEmployeeEvents();

    // Add event handlers for contractor edit and delete buttons
    this.container
      .querySelectorAll(".contractor-actions .btn-action.edit")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          const contractor = this.contractors.find(
            (c) => c.id === contractorId
          );
          if (contractor) {
            this.showContractorModal(contractor);
          }
        });
      });

    this.container
      .querySelectorAll(".contractor-actions .btn-action.delete")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          this.deleteContractor(contractorId);
        });
      });
  }

  renderEmployeesList(employees) {
    return employees
      .map(
        (employee) => `
        <div class="employee-item">
            <div class="employee-info">
                <strong>${employee.fullName}</strong>
                <span>${employee.position}</span>
                <span>${employee.phone}</span>
            </div>
            <div class="employee-actions">
                <button class="btn-action edit" data-employee-id="${employee.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" data-employee-id="${employee.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `
      )
      .join("");
  }

  bindEmployeeEvents() {
    // Обработчики для кнопок редактирования сотрудников
    this.container
      .querySelectorAll(".employee-actions .btn-action.edit")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const employeeId = parseInt(button.dataset.employeeId);
          const contractorId = parseInt(
            button.closest(".contractor-card").dataset.id
          );
          this.editEmployee(contractorId, employeeId);
        });
      });

    // Обработчики для кнопок удаления сотрудников
    this.container
      .querySelectorAll(".employee-actions .btn-action.delete")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const employeeId = parseInt(button.dataset.employeeId);
          const contractorId = parseInt(
            button.closest(".contractor-card").dataset.id
          );
          this.deleteEmployee(contractorId, employeeId);
        });
      });

    // Обработчики для кнопок добавления сотрудников
    this.container.querySelectorAll(".add-employee").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const contractorId = parseInt(button.dataset.contractorId);
        this.showEmployeeModal(contractorId);
      });
    });
  }

  showEmployeeModal(contractorId, employee = null) {
    const modal = this.container.querySelector("#employee-modal");
    const form = modal.querySelector("#employee-form");
    const title = modal.querySelector("#employee-modal-title");

    title.textContent = employee ? "Edit Employee" : "Add Employee";

    form.elements.contractorId.value = contractorId;

    if (employee) {
      form.elements.fullName.value = employee.fullName;
      form.elements.position.value = employee.position;
      form.elements.phone.value = employee.phone;
      form.dataset.employeeId = employee.id;
    } else {
      form.reset();
      form.elements.contractorId.value = contractorId;
      delete form.dataset.employeeId;
    }

    modal.classList.add("active");
  }

  editEmployee(contractorId, employeeId) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      const employee = contractor.employees.find((e) => e.id === employeeId);
      if (employee) {
        this.showEmployeeModal(contractorId, employee);
      }
    }
  }

  deleteEmployee(contractorId, employeeId) {
    if (confirm("Are you sure you want to delete this employee?")) {
      const contractor = this.contractors.find((c) => c.id === contractorId);
      if (contractor) {
        contractor.employees = contractor.employees.filter(
          (e) => e.id !== employeeId
        );
        this.renderContractors();
      }
    }
  }

  handleEmployeeSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const contractorId = parseInt(form.elements.contractorId.value);
    const employeeData = {
      fullName: form.elements.fullName.value,
      position: form.elements.position.value,
      phone: form.elements.phone.value,
    };

    if (form.dataset.employeeId) {
      // Редактирование существующего сотрудника
      const employeeId = parseInt(form.dataset.employeeId);
      this.updateEmployee(contractorId, employeeId, employeeData);
    } else {
      // Добавление нового сотрудника
      this.addEmployeeToContractor(contractorId, employeeData);
    }

    this.closeModals();
  }

  addEmployeeToContractor(contractorId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      // First add to local data structure for immediate feedback
      data.id = Date.now(); // Temporary ID
      contractor.employees.push(data);

      // Prepare data for API
      const existingEmployees = contractor.employees.filter(
        (e) => e.id !== data.id
      );

      const apiData = {
        company_name: contractor.companyName,
        business_type: contractor.businessType,
        location: contractor.location,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        notes: contractor.notes || "",
        employees: [
          ...existingEmployees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: 0,
          })),
          // Add new employee
          {
            name: data.fullName,
            position: data.position || "",
            phone: data.phone || "",
            email: data.email || "",
            is_primary_contact: 0,
          },
        ],
      };

      // Используем правильный URL API
      fetch(
        `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((responseData) => {
          if (responseData.success) {
            // Обновляем данные о сотрудниках из ответа API
            if (responseData.data && responseData.data.employees) {
              // Находим контрактор в массиве this.contractors и обновляем его сотрудников
              const updatedContractor = this.contractors.find(
                (c) => c.id === contractorId
              );
              if (updatedContractor) {
                // Преобразуем сотрудников из формата API в формат UI
                updatedContractor.employees = responseData.data.employees.map(
                  (emp) => ({
                    id: parseInt(emp.id),
                    fullName: emp.name,
                    position: emp.position || "",
                    phone: emp.phone || "",
                    email: emp.email || "",
                  })
                );
              }
            }

            // Перерисовываем UI для отображения обновленных данных
            this.renderContractors();
          } else {
            console.error("Error adding employee:", responseData.message);
            alert("Failed to add employee: " + responseData.message);
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          }
        })
        .catch((error) => {
          console.error("Error adding employee:", error);
          alert("Failed to add employee. Please try again.");
          // Обновляем данные с сервера в случае ошибки
          this.loadContractors().then(() => this.renderContractors());
        });

      // Render immediately for responsive UI
      this.renderContractors();
    }
  }

  updateEmployee(contractorId, employeeId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      const index = contractor.employees.findIndex((e) => e.id === employeeId);
      if (index !== -1) {
        // Update local data first
        contractor.employees[index] = {
          ...contractor.employees[index],
          ...data,
        };

        // Prepare data for API
        const apiData = {
          company_name: contractor.companyName,
          business_type: contractor.businessType,
          location: contractor.location,
          email: contractor.email,
          phone: contractor.phone,
          rating: contractor.rating,
          notes: contractor.notes || "",
          employees: contractor.employees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: e.isPrimaryContact ? 1 : 0,
          })),
        };

        // Используем правильный URL API
        fetch(
          `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiData),
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((responseData) => {
            if (responseData.success) {
              // Обновляем данные о сотрудниках из ответа API
              if (responseData.data && responseData.data.employees) {
                // Находим контрактор в массиве this.contractors и обновляем его сотрудников
                const updatedContractor = this.contractors.find(
                  (c) => c.id === contractorId
                );
                if (updatedContractor) {
                  // Преобразуем сотрудников из формата API в формат UI
                  updatedContractor.employees = responseData.data.employees.map(
                    (emp) => ({
                      id: parseInt(emp.id),
                      fullName: emp.name,
                      position: emp.position || "",
                      phone: emp.phone || "",
                      email: emp.email || "",
                    })
                  );
                }
              }

              // Перерисовываем UI для отображения обновленных данных
              this.renderContractors();
            } else {
              console.error("Error updating employee:", responseData.message);
              alert("Failed to update employee: " + responseData.message);
              // Обновляем данные с сервера в случае ошибки
              this.loadContractors().then(() => this.renderContractors());
            }
          })
          .catch((error) => {
            console.error("Error updating employee:", error);
            alert("Failed to update employee. Please try again.");
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          });

        // Render immediately for UI feedback
        this.renderContractors();
      }
    }
  }

  // Методы для работы с проектами
  async loadCurrentProjects() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?type=current"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Преобразуем свойства для совместимости с существующим кодом
        this.currentProjects = data.data.map((project) => ({
          id: project.id,
          name: project.name,
          location: project.location,
          startDate: project.start_date,
          endDate: project.end_date,
          businessType: project.business_type,
          contractorId: project.contractor_id,
          contractorName: project.contractor_name,
          contactPersonId: project.contact_person_id,
          contactPersonName: project.contact_person_name,
          status: project.status,
          progress: project.progress,
          actualCost: project.actual_cost,
          lastUpdate: project.last_update,
          files: project.files || [],
        }));
      } else {
        console.error("Error loading current projects:", data.message);
        this.currentProjects = [];
      }
    } catch (error) {
      console.error("Error loading current projects:", error);
      this.currentProjects = [];
    }
  }

  async loadFutureProjects() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?type=future"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Преобразуем свойства для совместимости с существующим кодом
        this.futureProjects = data.data.map((project) => ({
          id: project.id,
          name: project.name,
          location: project.location,
          startDate: project.start_date,
          endDate: project.end_date,
          businessType: project.business_type,
          contractorId: project.contractor_id,
          contractorName: project.contractor_name,
          contactPersonId: project.contact_person_id,
          contactPersonName: project.contact_person_name,
          status: project.status,
          budget: project.budget,
          priority: project.priority,
          description: project.description,
          objectives: project.objectives,
          risks: project.risks,
          files: project.files || [],
        }));
      } else {
        console.error("Error loading future projects:", data.message);
        this.futureProjects = [];
      }
    } catch (error) {
      console.error("Error loading future projects:", error);
      this.futureProjects = [];
    }
  }

  renderProjects(type, projectsToRender = null) {
    const projects =
      projectsToRender ||
      (type === "current" ? this.currentProjects : this.futureProjects);
    const container = this.container.querySelector(`#${type}-projects-list`);

    if (!container) {
      console.error(`Container #${type}-projects-list not found`);
      return;
    }

    console.log(`Rendering ${type} projects:`, projects);
    container.innerHTML = "";

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>No projects found</p>
        </div>
      `;

      // Update statistics even if no projects are found
      this.updateProjectStatistics(type);
      return;
    }

    projects.forEach((project) => {
      // Организуем файлы проекта по категориям
      const organizedProject = this.organizeProjectFiles(project);

      const contractor = this.contractors.find(
        (c) => c.id === organizedProject.contractorId
      );
      const template = this.container.querySelector(
        `#${type}-project-card-template`
      );

      if (!template) {
        console.error(`Template #${type}-project-card-template not found`);
        return;
      }

      const card = template.content.cloneNode(true);

      // Set project ID
      const projectCard = card.querySelector(".project-card");
      projectCard.dataset.id = organizedProject.id;

      // Set project name and status
      card.querySelector(".project-name").textContent = organizedProject.name;
      const statusSelect = card.querySelector(".status-select");
      statusSelect.value = organizedProject.status;

      // Добавляем data-атрибут для привязки к проекту
      statusSelect.setAttribute("data-project-id", organizedProject.id);

      // Обновляем классы статуса
      this.updateStatusClasses(statusSelect, organizedProject.status);

      // Set project details
      card.querySelector(".location").textContent = organizedProject.location;

      // Форматируем даты для отображения
      const startDateFormatted = this.formatDateForDisplay(
        organizedProject.startDate
      );
      const endDateFormatted = this.formatDateForDisplay(
        organizedProject.endDate
      );
      card.querySelector(
        ".dates"
      ).textContent = `${startDateFormatted} - ${endDateFormatted}`;

      if (type === "current") {
        this.renderCurrentProjectDetails(card, organizedProject, contractor);
      } else {
        this.renderFutureProjectDetails(card, organizedProject, contractor);
      }

      // Добавляем карточку в контейнер
      container.appendChild(card);
    });

    // After rendering all projects, update the statistics
    this.updateProjectStatistics(type);

    // Bind events to project cards
    this.bindProjectCardEvents(type);

    // Привязываем события к предпросмотрам файлов
    this.bindFilePreviewEvents();

    // Добавим дополнительную логику для обработки всех изображений на странице
    this.enhanceAllImagePreviews(type);
  }

  // Метод для улучшения всех превью изображений в указанной секции
  enhanceAllImagePreviews(type) {
    // Получаем контейнер для секции
    const sectionId =
      type === "current"
        ? "current-projects-section"
        : "future-projects-section";
    const section = this.container.querySelector(`#${sectionId}`);
    if (!section) return;

    // Находим все изображения в секции
    const images = section.querySelectorAll(".file-preview-container img");
    images.forEach((img) => {
      // Проверяем, что у изображения есть src
      const src = img.getAttribute("src");
      if (src) {
        // Делаем курсор указателем
        img.style.cursor = "pointer";

        // Удаляем старые обработчики, чтобы избежать дублирования
        const newImg = img.cloneNode(true);
        img.parentNode.replaceChild(newImg, img);

        // Добавляем обработчик клика
        newImg.addEventListener("click", () => {
          console.log("Image clicked:", src);
          this.showImageModal(src);
        });
      }
    });

    console.log(`Enhanced ${images.length} images in ${type} projects section`);
  }

  updateStatusClasses(statusSelect, status) {
    // Удаляем все существующие классы статуса
    statusSelect.classList.remove(
      "planned",
      "in-progress",
      "completed",
      "on-hold",
      "move-to-current",
      "delayed",
      "design-phase", // Добавляем новые возможные статусы
      "planning"
    );

    // Преобразуем статус для использования в качестве CSS класса (заменяем пробелы на дефисы)
    const statusClass = status.replace(/\s+/g, "-").toLowerCase();

    // Добавляем новый класс статуса
    statusSelect.classList.add(statusClass);

    // Сбрасываем inline стили, которые могли быть установлены ранее
    statusSelect.style.backgroundColor = "";
    statusSelect.style.color = "";
    statusSelect.style.borderColor = "";

    // Определяем цвета в зависимости от статуса
    let colors = {
      planned: {
        bg: "#e3f2fd",
        color: "#1976d2",
        border: "#90caf9",
      },
      "in-progress": {
        bg: "#fff3e0",
        color: "#f57c00",
        border: "#ffcc80",
      },
      completed: {
        bg: "#e8f5e9",
        color: "#388e3c",
        border: "#a5d6a7",
      },
      "on-hold": {
        bg: "#ffebee",
        color: "#d32f2f",
        border: "#ef9a9a",
      },
      "move-to-current": {
        bg: "#f3e5f5",
        color: "#7b1fa2",
        border: "#ce93d8",
      },
      delayed: {
        bg: "#ffebee",
        color: "#d32f2f",
        border: "#ef9a9a",
      },
      "design-phase": {
        // Добавляем новые статусы с цветами
        bg: "#e0f7fa",
        color: "#0097a7",
        border: "#80deea",
      },
      planning: {
        bg: "#f3e5f5",
        color: "#8e24aa",
        border: "#ce93d8",
      },
    };

    // Пробуем найти цвета для статуса напрямую или для его CSS версии
    let colorConfig = colors[status] || colors[statusClass];

    // Применяем стили, если статус найден в нашем объекте
    if (colorConfig) {
      statusSelect.style.backgroundColor = colorConfig.bg;
      statusSelect.style.color = colorConfig.color;
      statusSelect.style.borderColor = colorConfig.border;
      statusSelect.style.borderWidth = "1px";
      statusSelect.style.borderStyle = "solid";
    } else {
      // Если статус неизвестен, применяем стандартные стили
      statusSelect.style.backgroundColor = "#f5f5f5";
      statusSelect.style.color = "#616161";
      statusSelect.style.borderColor = "#bdbdbd";
      statusSelect.style.borderWidth = "1px";
      statusSelect.style.borderStyle = "solid";
    }

    // Устанавливаем data-атрибут для дополнительной поддержки селекторов
    statusSelect.setAttribute("data-status", status);
  }

  // Helper method to update card size after toggle
  updateCardSize(card) {
    // Ensure card is a DOM element
    if (!card || typeof card.closest !== "function") {
      // If card is not a DOM element, try to find the project card differently
      // This handles cases where 'card' might be the project card body or another element
      const projectCard = card.parentElement
        ? card.parentElement.closest(".project-card")
        : document.querySelector(".project-card");

      if (projectCard) {
        // Set height to auto to let it resize naturally
        projectCard.style.height = "auto";
        const cardBody = projectCard.querySelector(".card-body");
        if (cardBody) {
          cardBody.style.height = "auto";
        }
      }
      return;
    }

    // Regular handling if card is a DOM element with closest method
    const projectCard = card.closest(".project-card");
    if (projectCard) {
      // Ensure card body expands/contracts with content
      const cardBody = projectCard.querySelector(".card-body");
      if (cardBody) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          // Reset any fixed heights
          cardBody.style.height = "";
          projectCard.style.height = "";

          // Calculate and set new height
          const height = cardBody.scrollHeight;
          cardBody.style.height = height + "px";

          // Allow height to adjust naturally after initial animation
          setTimeout(() => {
            cardBody.style.height = "auto";
          }, 300);
        }, 10);
      }
    }
  }

  renderCurrentProjectDetails(card, project, contractor) {
    // Set current project specific details
    card.querySelector(".progress").textContent = project.progress
      ? `${project.progress}%`
      : "Not started";
    card.querySelector(".actual-cost").textContent = project.actualCost
      ? `$${project.actualCost.toLocaleString()}`
      : "Not specified";
    card.querySelector(".contractor").textContent = contractor
      ? contractor.companyName
      : "Not assigned";
    card.querySelector(".project-manager").textContent =
      contractor && contractor.contactPerson
        ? `${contractor.contactPerson.name} (${contractor.contactPerson.position})`
        : "Not assigned";

    // Форматируем дату последнего обновления
    const lastUpdateFormatted = project.lastUpdate
      ? this.formatDateForDisplay(project.lastUpdate)
      : "Not updated";
    card.querySelector(".last-update").textContent = lastUpdateFormatted;

    // Определяем, является ли проект перенесенным из Future в Current
    const isMigratedProject =
      project.description ||
      project.objectives ||
      project.risks ||
      project.priority ||
      (project.specifications && project.specifications.length > 0) ||
      (project.budgetDocs && project.budgetDocs.length > 0) ||
      (project.documents &&
        project.documents.length > 0 &&
        project.migratedFromFuture);

    const detailsSection = card.querySelector(".project-details");

    // Make Project Documents header collapsible
    const documentsSection = detailsSection.querySelector(
      ".details-section:last-child"
    );
    const docHeader = documentsSection.querySelector("h4");

    // Make header collapsible
    docHeader.classList.add("collapsible-header");
    const documentsGrid = documentsSection.querySelector(".documents-grid");
    documentsGrid.classList.add("collapsible-content");

    // Add click event to toggle
    docHeader.addEventListener("click", (e) => {
      e.preventDefault();
      docHeader.classList.toggle("collapsed");
      documentsGrid.classList.toggle("collapsed");

      // Update card size after toggle - pass the project card element
      this.updateCardSize(docHeader.closest(".project-card"));
    });

    // Reorganize documents grid - group migrated files at the top
    if (isMigratedProject) {
      // Clear existing content
      documentsGrid.innerHTML = "";

      // Add a collapsible header for migrated files
      const migratedHeader = document.createElement("div");
      migratedHeader.className = "section-header";
      migratedHeader.innerHTML = `
        <h4 class="toggle-documents">
          <i class="fas fa-chevron-down"></i> 
          <span class="from-future-flag">From Future Project</span>
        </h4>
      `;
      documentsGrid.appendChild(migratedHeader);

      // Create migrated files group
      const migratedFilesGroup = document.createElement("div");
      migratedFilesGroup.className = "migrated-files-group documents-content";
      documentsGrid.appendChild(migratedFilesGroup);

      // Make sure content is fully visible with scrolling if needed
      migratedFilesGroup.style.overflowY = "visible";
      migratedFilesGroup.style.maxHeight = "none";
      documentsGrid.style.overflowY = "visible";

      // Add Planning Documents (formerly called Documents in Future Projects) if they exist
      if (
        project.documents &&
        project.documents.length > 0 &&
        project.migratedFromFuture
      ) {
        const planningDocsGroup = document.createElement("div");
        planningDocsGroup.className = "documents-group migrated-files";
        planningDocsGroup.innerHTML = `
          <h5>Planning Documents</h5>
          <div class="planning-docs-preview file-preview-container">
            ${this.renderFilePreviews(project.documents, "document")}
          </div>
        `;
        migratedFilesGroup.appendChild(planningDocsGroup);
      }

      // Add specifications if they exist
      if (project.specifications && project.specifications.length > 0) {
        const specificationsGroup = document.createElement("div");
        specificationsGroup.className = "documents-group migrated-files";
        specificationsGroup.innerHTML = `
          <h5>Specifications</h5>
          <div class="specifications-preview file-preview-container">
            ${this.renderFilePreviews(project.specifications, "specification")}
          </div>
        `;
        migratedFilesGroup.appendChild(specificationsGroup);
      }

      // Add budget documents if they exist
      if (project.budgetDocs && project.budgetDocs.length > 0) {
        const budgetDocsGroup = document.createElement("div");
        budgetDocsGroup.className = "documents-group migrated-files";
        budgetDocsGroup.innerHTML = `
          <h5>Budget Documents</h5>
          <div class="budget-docs-preview file-preview-container">
            ${this.renderFilePreviews(project.budgetDocs, "budgetDoc")}
          </div>
        `;
        migratedFilesGroup.appendChild(budgetDocsGroup);
      }

      // Add a collapsible header for current files
      const currentHeader = document.createElement("div");
      currentHeader.className = "section-header";
      currentHeader.innerHTML = `
        <h4 class="toggle-documents">
          <i class="fas fa-chevron-down"></i> 
          <span class="current-files-title">Current Project Files</span>
        </h4>
      `;
      documentsGrid.appendChild(currentHeader);

      // Create current files group
      const currentFilesGroup = document.createElement("div");
      currentFilesGroup.className = "current-files-group documents-content";
      documentsGrid.appendChild(currentFilesGroup);

      // Add current files (Photos, Reports)
      // Photos
      if (project.photos && project.photos.length > 0) {
        const photosGroup = document.createElement("div");
        photosGroup.className = "documents-group";
        photosGroup.innerHTML = `
          <h5>Photos</h5>
          <div class="photos-preview file-preview-container">
            ${this.renderFilePreviews(project.photos, "photo")}
          </div>
        `;
        currentFilesGroup.appendChild(photosGroup);
      } else {
        const photosGroup = document.createElement("div");
        photosGroup.className = "documents-group";
        photosGroup.innerHTML = `
          <h5>Photos</h5>
          <div class="photos-preview file-preview-container"></div>
        `;
        currentFilesGroup.appendChild(photosGroup);
      }

      // Reports
      if (project.reports && project.reports.length > 0) {
        const reportsGroup = document.createElement("div");
        reportsGroup.className = "documents-group";
        reportsGroup.innerHTML = `
          <h5>Reports</h5>
          <div class="reports-preview file-preview-container">
            ${this.renderFilePreviews(project.reports, "report")}
          </div>
        `;
        currentFilesGroup.appendChild(reportsGroup);
      } else {
        const reportsGroup = document.createElement("div");
        reportsGroup.className = "documents-group";
        reportsGroup.innerHTML = `
          <h5>Reports</h5>
          <div class="reports-preview file-preview-container"></div>
        `;
        currentFilesGroup.appendChild(reportsGroup);
      }

      // Add toggle functionality for each section individually
      const toggleSections = card.querySelectorAll(".toggle-documents");
      toggleSections.forEach((toggle) => {
        toggle.addEventListener("click", (e) => {
          const content = toggle.closest(".section-header").nextElementSibling;
          content.classList.toggle("collapsed");
          const icon = toggle.querySelector("i");
          icon.classList.toggle("fa-chevron-down");
          icon.classList.toggle("fa-chevron-right");

          // Update card size after toggle
          this.updateCardSize(toggle.closest(".project-card"));
        });
      });
    } else {
      // Just set file previews without reorganization
      if (project.photos && project.photos.length > 0) {
        card.querySelector(".photos-preview").innerHTML =
          this.renderFilePreviews(project.photos, "photo");
      }
      if (project.documents && project.documents.length > 0) {
        card.querySelector(".documents-preview").innerHTML =
          this.renderFilePreviews(project.documents, "document");
      }
      if (project.reports && project.reports.length > 0) {
        card.querySelector(".reports-preview").innerHTML =
          this.renderFilePreviews(project.reports, "report");
      }
    }
  }

  renderFutureProjectDetails(card, project, contractor) {
    // Future project specific details
    card.querySelector(".budget").textContent = project.budget
      ? `$${project.budget.toLocaleString()}`
      : "Not specified";
    card.querySelector(".priority").textContent = project.priority
      ? project.priority.charAt(0).toUpperCase() + project.priority.slice(1)
      : "Not specified";
    card.querySelector(".preferred-contractor").textContent = contractor
      ? contractor.companyName
      : "Not assigned";
    card.querySelector(".project-manager").textContent =
      contractor && contractor.contactPerson
        ? `${contractor.contactPerson.name} (${contractor.contactPerson.position})`
        : "Not assigned";

    // Set planning details
    card.querySelector(".description").textContent =
      project.description || "No description available";
    card.querySelector(".objectives").textContent =
      project.objectives || "No objectives defined";
    card.querySelector(".risks").textContent =
      project.risks || "No risks identified";

    // Make Project Documents header collapsible
    const detailsSection = card.querySelector(".project-details");
    const documentsSection = detailsSection.querySelector(
      ".details-section:last-child"
    );
    const docHeader = documentsSection.querySelector("h4");

    // Make header collapsible
    docHeader.classList.add("collapsible-header");
    const documentsGrid = documentsSection.querySelector(".documents-grid");
    documentsGrid.classList.add("collapsible-content");

    // Add click event to toggle
    docHeader.addEventListener("click", (e) => {
      e.preventDefault();
      docHeader.classList.toggle("collapsed");
      documentsGrid.classList.toggle("collapsed");

      // Update card size after toggle
      this.updateCardSize(card);
    });

    // Set file previews
    if (project.documents && project.documents.length > 0) {
      card.querySelector(".documents-preview").innerHTML =
        this.renderFilePreviews(project.documents, "document");
    }
    if (project.specifications && project.specifications.length > 0) {
      card.querySelector(".specifications-preview").innerHTML =
        this.renderFilePreviews(project.specifications, "specification");
    }
  }

  renderFilePreviews(files, type) {
    // Проверяем, что files - это массив
    if (!files || !Array.isArray(files) || files.length === 0) {
      return "";
    }

    console.log(`Rendering file previews for ${type}:`, files);

    // Капитализируем тип для отображения
    const displayType = type.charAt(0).toUpperCase() + type.slice(1);

    // Генерируем HTML для каждого файла
    const previewsHtml = files
      .map((file) => {
        if (!file) return "";

        // Извлекаем необходимые свойства из файла
        const fileName =
          file.fileName ||
          file.original_name ||
          file.name ||
          file.file_name ||
          "Unknown file";
        let filePath = file.filePath || file.file_path || "";
        let miniPath = file.miniPath || file.mini_path || "";
        const fileId = file.fileId || file.id || "";
        const mimeType =
          file.mimeType || file.mime_type || file.type || file.file_type || "";
        const fileSize = file.fileSize || file.file_size || file.size || 0;

        // Проверяем, является ли путь относительным, и если да, добавляем базовый путь
        if (
          filePath &&
          !filePath.startsWith("http") &&
          !filePath.startsWith("/")
        ) {
          filePath = `/Maintenance_P/Inspections-Checklist-Portal/components/construction/${filePath}`;
        } else if (
          filePath &&
          !filePath.startsWith("http") &&
          !filePath.startsWith("/Maintenance_P")
        ) {
          filePath = `/Maintenance_P${filePath}`;
        }

        if (
          miniPath &&
          !miniPath.startsWith("http") &&
          !miniPath.startsWith("/")
        ) {
          miniPath = `/Maintenance_P/Inspections-Checklist-Portal/components/construction/${miniPath}`;
        } else if (
          miniPath &&
          !miniPath.startsWith("http") &&
          !miniPath.startsWith("/Maintenance_P")
        ) {
          miniPath = `/Maintenance_P${miniPath}`;
        }

        // Определяем, является ли файл изображением
        const isImage = mimeType && mimeType.startsWith("image/");

        // Определяем класс иконки для не-изображений
        let iconClass = "fas fa-file";
        if (!isImage) {
          if (mimeType.includes("pdf")) {
            iconClass = "fas fa-file-pdf";
          } else if (
            mimeType.includes("word") ||
            mimeType.includes("document")
          ) {
            iconClass = "fas fa-file-word";
          } else if (
            mimeType.includes("excel") ||
            mimeType.includes("spreadsheet")
          ) {
            iconClass = "fas fa-file-excel";
          } else if (
            mimeType.includes("powerpoint") ||
            mimeType.includes("presentation")
          ) {
            iconClass = "fas fa-file-powerpoint";
          } else if (mimeType.includes("text")) {
            iconClass = "fas fa-file-alt";
          } else if (mimeType.includes("zip") || mimeType.includes("archive")) {
            iconClass = "fas fa-file-archive";
          }
        }

        // Строим HTML для превью файла
        return `
        <div class="file-preview-item" 
             data-file-id="${fileId}" 
             data-file-path="${filePath}" 
             data-mime-type="${mimeType}">
          ${
            isImage
              ? `<img src="${miniPath || filePath}" alt="${fileName}" />`
              : `<i class="${iconClass} file-type-icon"></i>`
          }
          <div class="file-info">
            <span class="file-name" title="${fileName}">${fileName}</span>
            ${
              fileSize
                ? `<span class="file-size">${this.formatFileSize(
                    fileSize
                  )}</span>`
                : ""
            }
          </div>
          <button class="file-action-btn view-file" title="View file">
            <i class="fas fa-eye"></i>
          </button>
          <button class="file-action-btn remove-file" title="Remove file">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      })
      .join("");

    return previewsHtml;
  }

  // Helper method to get the appropriate icon class based on file MIME type
  getFileIconClass(mimeType) {
    if (!mimeType) return "fas fa-file";

    if (mimeType.startsWith("image/")) return "fas fa-file-image";
    if (mimeType === "application/pdf") return "fas fa-file-pdf";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "fas fa-file-word";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "fas fa-file-excel";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return "fas fa-file-powerpoint";
    if (mimeType.includes("text/")) return "fas fa-file-alt";
    if (mimeType.includes("zip") || mimeType.includes("compressed"))
      return "fas fa-file-archive";

    return "fas fa-file";
  }

  formatFileSize(bytes) {
    if (!bytes) return "";

    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  updateProgress(progressBar, progressText, current, total) {
    const percentage = (current / total) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `Uploading: ${Math.round(percentage)}%`;

    if (current === total) {
      setTimeout(() => {
        progressBar.style.width = "0%";
        progressText.textContent = "Uploading: 0%";
      }, 1000);
    }
  }

  onSectionChange(sectionId) {
    // Если секция не указана, используем активную
    if (!sectionId) {
      const activeSection = this.container.querySelector(
        ".construction-section.active"
      );
      if (activeSection) {
        sectionId = activeSection.id;
      } else {
        return;
      }
    }

    // Вызываем специфические действия для каждой секции
    if (sectionId === "contractors-section") {
      this.renderContractors();
    } else if (sectionId === "current-projects-section") {
      this.renderProjects("current");
    } else if (sectionId === "future-projects-section") {
      this.renderProjects("future");
    }

    // Update statistics for the active section
    if (sectionId === "current-projects-section") {
      this.updateProjectStatistics("current");
    } else if (sectionId === "future-projects-section") {
      this.updateProjectStatistics("future");
    }
  }

  async loadData() {
    try {
      // Here will be API calls to load data
      // For now using mock data
      await this.loadContractors();
      this.updateBusinessTypeFilter(); // Обновляем список типов бизнеса после загрузки
      await this.loadCurrentProjects();
      await this.loadFutureProjects();
      this.renderActiveSection();

      // Update statistics for both sections after loading data
      this.updateProjectStatistics("current");
      this.updateProjectStatistics("future");
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  switchTab(tab) {
    this.container
      .querySelectorAll(".construction-section")
      .forEach((s) => s.classList.remove("active"));

    // Update section title
    const sectionTitle = this.container.querySelector("#section-title");
    if (sectionTitle) {
      sectionTitle.textContent =
        tab === "contractors"
          ? "Contractors"
          : tab === "current-projects"
          ? "Current Projects"
          : "Future Projects";
    }

    // Show appropriate section
    this.container.querySelector(`#${tab}-section`).classList.add("active");

    // Update filters visibility
    const contractorsFilters = this.container.querySelector(
      "#contractors-filters"
    );
    const currentProjectsFilters = this.container.querySelector(
      "#current-projects-filters"
    );
    const futureProjectsFilters = this.container.querySelector(
      "#future-projects-filters"
    );

    if (contractorsFilters) {
      contractorsFilters.style.display =
        tab === "contractors" ? "flex" : "none";
    }
    if (currentProjectsFilters) {
      currentProjectsFilters.style.display =
        tab === "current-projects" ? "flex" : "none";
    }
    if (futureProjectsFilters) {
      futureProjectsFilters.style.display =
        tab === "future-projects" ? "flex" : "none";
    }

    // Update add buttons visibility
    const addContractorBtn = this.container.querySelector("#add-contractor");
    const addCurrentProjectBtn = this.container.querySelector(
      "#add-current-project"
    );
    const addFutureProjectBtn = this.container.querySelector(
      "#add-future-project"
    );

    if (addContractorBtn) {
      addContractorBtn.style.display = tab === "contractors" ? "block" : "none";
    }
    if (addCurrentProjectBtn) {
      addCurrentProjectBtn.style.display =
        tab === "current-projects" ? "block" : "none";
    }
    if (addFutureProjectBtn) {
      addFutureProjectBtn.style.display =
        tab === "future-projects" ? "block" : "none";
    }

    this.activeTab = tab;
    this.renderActiveSection();

    // Update project statistics when switching to project tabs
    if (tab === "current-projects") {
      this.updateProjectStatistics("current");
    } else if (tab === "future-projects") {
      this.updateProjectStatistics("future");
    }
  }

  renderActiveSection() {
    switch (this.activeTab) {
      case "contractors":
        this.renderContractors();
        break;
      case "current-projects":
        this.renderProjects("current");
        break;
      case "future-projects":
        this.renderProjects("future");
        break;
    }
  }

  // Методы для работы с подрядчиками
  async loadContractors() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Convert API format to client format
        this.contractors = result.data.map((contractor) => {
          return {
            id: parseInt(contractor.id),
            companyName: contractor.company_name,
            businessType: contractor.business_type,
            location: contractor.location || "",
            email: contractor.email || "",
            phone: contractor.phone || "",
            rating: parseInt(contractor.rating) || 0,
            contactPerson: contractor.contact_person
              ? {
                  id: parseInt(contractor.contact_person.id),
                  name: contractor.contact_person.name,
                  position: contractor.contact_person.position || "",
                  phone: contractor.contact_person.phone || "",
                  email: contractor.contact_person.email || "",
                }
              : {
                  name: "None",
                  position: "",
                  phone: "",
                  email: "",
                },
            employees: contractor.employees
              ? contractor.employees.map((emp) => ({
                  id: parseInt(emp.id),
                  fullName: emp.name,
                  position: emp.position || "",
                  phone: emp.phone || "",
                  email: emp.email || "",
                }))
              : [],
          };
        });
      } else {
        console.error("Failed to load contractors:", result.message);
        // Fallback to empty array
        this.contractors = [];
      }
    } catch (error) {
      console.error("Error loading contractors:", error);
      // Fallback to empty array on error
      this.contractors = [];
    }
  }

  renderContractors() {
    const container = this.container.querySelector("#contractors-list");
    if (!container) return;

    if (this.contractors.length === 0) {
      container.innerHTML = `
            <div class="no-contractors">
                <i class="fas fa-building"></i>
                <h3>No Contractors Yet</h3>
                <p>Click the "Add Contractor" button to add your first contractor</p>
            </div>
        `;
      return;
    }

    container.innerHTML = this.contractors
      .map(
        (contractor) => `
      <div class="contractor-card" data-id="${contractor.id}">
        <div class="contractor-header">
          <h3>${contractor.companyName}</h3>
          <div class="contractor-rating">
            ${this.generateRatingStars(contractor.rating)}
          </div>
        </div>
        <div class="contractor-info">
          <div class="info-item">
            <i class="fas fa-briefcase"></i>
            <span>${contractor.businessType}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-location-dot"></i>
            <span>${contractor.location}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.email}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.phone}</span>
          </div>
        </div>
        <div class="contact-person-info">
          <h4>Contact Person</h4>
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span>${contractor.contactPerson.name}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-id-badge"></i>
            <span>${contractor.contactPerson.position}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.contactPerson.phone}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.contactPerson.email}</span>
          </div>
        </div>
        <div class="contractor-employees">
          <h4>Employees (${contractor.employees.length})</h4>
          <div class="employees-list">
            ${this.renderEmployeesList(contractor.employees)}
          </div>
          <button class="btn-secondary add-employee" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-user-plus"></i> Add Employee
          </button>
        </div>
        <div class="contractor-actions">
          <button class="btn-action edit" data-contractor-id="${contractor.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action delete" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    // Добавляем обработчики событий после рендеринга
    this.bindEmployeeEvents();

    // Add event handlers for contractor edit and delete buttons
    this.container
      .querySelectorAll(".contractor-actions .btn-action.edit")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          const contractor = this.contractors.find(
            (c) => c.id === contractorId
          );
          if (contractor) {
            this.showContractorModal(contractor);
          }
        });
      });

    this.container
      .querySelectorAll(".contractor-actions .btn-action.delete")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          this.deleteContractor(contractorId);
        });
      });
  }

  renderEmployeesList(employees) {
    return employees
      .map(
        (employee) => `
        <div class="employee-item">
            <div class="employee-info">
                <strong>${employee.fullName}</strong>
                <span>${employee.position}</span>
                <span>${employee.phone}</span>
            </div>
            <div class="employee-actions">
                <button class="btn-action edit" data-employee-id="${employee.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" data-employee-id="${employee.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `
      )
      .join("");
  }

  bindEmployeeEvents() {
    // Обработчики для кнопок редактирования сотрудников
    this.container
      .querySelectorAll(".employee-actions .btn-action.edit")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const employeeId = parseInt(button.dataset.employeeId);
          const contractorId = parseInt(
            button.closest(".contractor-card").dataset.id
          );
          this.editEmployee(contractorId, employeeId);
        });
      });

    // Обработчики для кнопок удаления сотрудников
    this.container
      .querySelectorAll(".employee-actions .btn-action.delete")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const employeeId = parseInt(button.dataset.employeeId);
          const contractorId = parseInt(
            button.closest(".contractor-card").dataset.id
          );
          this.deleteEmployee(contractorId, employeeId);
        });
      });

    // Обработчики для кнопок добавления сотрудников
    this.container.querySelectorAll(".add-employee").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const contractorId = parseInt(button.dataset.contractorId);
        this.showEmployeeModal(contractorId);
      });
    });
  }

  showEmployeeModal(contractorId, employee = null) {
    const modal = this.container.querySelector("#employee-modal");
    const form = modal.querySelector("#employee-form");
    const title = modal.querySelector("#employee-modal-title");

    title.textContent = employee ? "Edit Employee" : "Add Employee";

    form.elements.contractorId.value = contractorId;

    if (employee) {
      form.elements.fullName.value = employee.fullName;
      form.elements.position.value = employee.position;
      form.elements.phone.value = employee.phone;
      form.dataset.employeeId = employee.id;
    } else {
      form.reset();
      form.elements.contractorId.value = contractorId;
      delete form.dataset.employeeId;
    }

    modal.classList.add("active");
  }

  editEmployee(contractorId, employeeId) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      const employee = contractor.employees.find((e) => e.id === employeeId);
      if (employee) {
        this.showEmployeeModal(contractorId, employee);
      }
    }
  }

  deleteEmployee(contractorId, employeeId) {
    if (confirm("Are you sure you want to delete this employee?")) {
      const contractor = this.contractors.find((c) => c.id === contractorId);
      if (contractor) {
        contractor.employees = contractor.employees.filter(
          (e) => e.id !== employeeId
        );
        this.renderContractors();
      }
    }
  }

  handleEmployeeSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const contractorId = parseInt(form.elements.contractorId.value);
    const employeeData = {
      fullName: form.elements.fullName.value,
      position: form.elements.position.value,
      phone: form.elements.phone.value,
    };

    if (form.dataset.employeeId) {
      // Редактирование существующего сотрудника
      const employeeId = parseInt(form.dataset.employeeId);
      this.updateEmployee(contractorId, employeeId, employeeData);
    } else {
      // Добавление нового сотрудника
      this.addEmployeeToContractor(contractorId, employeeData);
    }

    this.closeModals();
  }

  addEmployeeToContractor(contractorId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      // First add to local data structure for immediate feedback
      data.id = Date.now(); // Temporary ID
      contractor.employees.push(data);

      // Prepare data for API
      const existingEmployees = contractor.employees.filter(
        (e) => e.id !== data.id
      );

      const apiData = {
        company_name: contractor.companyName,
        business_type: contractor.businessType,
        location: contractor.location,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        notes: contractor.notes || "",
        employees: [
          ...existingEmployees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: 0,
          })),
          // Add new employee
          {
            name: data.fullName,
            position: data.position || "",
            phone: data.phone || "",
            email: data.email || "",
            is_primary_contact: 0,
          },
        ],
      };

      // Используем правильный URL API
      fetch(
        `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((responseData) => {
          if (responseData.success) {
            // Обновляем данные о сотрудниках из ответа API
            if (responseData.data && responseData.data.employees) {
              // Находим контрактор в массиве this.contractors и обновляем его сотрудников
              const updatedContractor = this.contractors.find(
                (c) => c.id === contractorId
              );
              if (updatedContractor) {
                // Преобразуем сотрудников из формата API в формат UI
                updatedContractor.employees = responseData.data.employees.map(
                  (emp) => ({
                    id: parseInt(emp.id),
                    fullName: emp.name,
                    position: emp.position || "",
                    phone: emp.phone || "",
                    email: emp.email || "",
                  })
                );
              }
            }

            // Перерисовываем UI для отображения обновленных данных
            this.renderContractors();
          } else {
            console.error("Error adding employee:", responseData.message);
            alert("Failed to add employee: " + responseData.message);
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          }
        })
        .catch((error) => {
          console.error("Error adding employee:", error);
          alert("Failed to add employee. Please try again.");
          // Обновляем данные с сервера в случае ошибки
          this.loadContractors().then(() => this.renderContractors());
        });

      // Render immediately for responsive UI
      this.renderContractors();
    }
  }

  updateEmployee(contractorId, employeeId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      const index = contractor.employees.findIndex((e) => e.id === employeeId);
      if (index !== -1) {
        // Update local data first
        contractor.employees[index] = {
          ...contractor.employees[index],
          ...data,
        };

        // Prepare data for API
        const apiData = {
          company_name: contractor.companyName,
          business_type: contractor.businessType,
          location: contractor.location,
          email: contractor.email,
          phone: contractor.phone,
          rating: contractor.rating,
          notes: contractor.notes || "",
          employees: contractor.employees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: e.isPrimaryContact ? 1 : 0,
          })),
        };

        // Используем правильный URL API
        fetch(
          `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiData),
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((responseData) => {
            if (responseData.success) {
              // Обновляем данные о сотрудниках из ответа API
              if (responseData.data && responseData.data.employees) {
                // Находим контрактор в массиве this.contractors и обновляем его сотрудников
                const updatedContractor = this.contractors.find(
                  (c) => c.id === contractorId
                );
                if (updatedContractor) {
                  // Преобразуем сотрудников из формата API в формат UI
                  updatedContractor.employees = responseData.data.employees.map(
                    (emp) => ({
                      id: parseInt(emp.id),
                      fullName: emp.name,
                      position: emp.position || "",
                      phone: emp.phone || "",
                      email: emp.email || "",
                    })
                  );
                }
              }

              // Перерисовываем UI для отображения обновленных данных
              this.renderContractors();
            } else {
              console.error("Error updating employee:", responseData.message);
              alert("Failed to update employee: " + responseData.message);
              // Обновляем данные с сервера в случае ошибки
              this.loadContractors().then(() => this.renderContractors());
            }
          })
          .catch((error) => {
            console.error("Error updating employee:", error);
            alert("Failed to update employee. Please try again.");
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          });

        // Render immediately for UI feedback
        this.renderContractors();
      }
    }
  }

  // Методы для работы с проектами
  async loadCurrentProjects() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?type=current"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Преобразуем свойства для совместимости с существующим кодом
        this.currentProjects = data.data.map((project) => ({
          id: project.id,
          name: project.name,
          location: project.location,
          startDate: project.start_date,
          endDate: project.end_date,
          businessType: project.business_type,
          contractorId: project.contractor_id,
          contractorName: project.contractor_name,
          contactPersonId: project.contact_person_id,
          contactPersonName: project.contact_person_name,
          status: project.status,
          progress: project.progress,
          actualCost: project.actual_cost,
          lastUpdate: project.last_update,
          files: project.files || [],
        }));
      } else {
        console.error("Error loading current projects:", data.message);
        this.currentProjects = [];
      }
    } catch (error) {
      console.error("Error loading current projects:", error);
      this.currentProjects = [];
    }
  }

  async loadFutureProjects() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?type=future"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Преобразуем свойства для совместимости с существующим кодом
        this.futureProjects = data.data.map((project) => ({
          id: project.id,
          name: project.name,
          location: project.location,
          startDate: project.start_date,
          endDate: project.end_date,
          businessType: project.business_type,
          contractorId: project.contractor_id,
          contractorName: project.contractor_name,
          contactPersonId: project.contact_person_id,
          contactPersonName: project.contact_person_name,
          status: project.status,
          budget: project.budget,
          priority: project.priority,
          description: project.description,
          objectives: project.objectives,
          risks: project.risks,
          files: project.files || [],
        }));
      } else {
        console.error("Error loading future projects:", data.message);
        this.futureProjects = [];
      }
    } catch (error) {
      console.error("Error loading future projects:", error);
      this.futureProjects = [];
    }
  }

  renderProjects(type, projectsToRender = null) {
    const projects =
      projectsToRender ||
      (type === "current" ? this.currentProjects : this.futureProjects);
    const container = this.container.querySelector(`#${type}-projects-list`);

    if (!container) {
      console.error(`Container #${type}-projects-list not found`);
      return;
    }

    console.log(`Rendering ${type} projects:`, projects);
    container.innerHTML = "";

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>No projects found</p>
        </div>
      `;

      // Update statistics even if no projects are found
      this.updateProjectStatistics(type);
      return;
    }

    projects.forEach((project) => {
      // Организуем файлы проекта по категориям
      const organizedProject = this.organizeProjectFiles(project);

      const contractor = this.contractors.find(
        (c) => c.id === organizedProject.contractorId
      );
      const template = this.container.querySelector(
        `#${type}-project-card-template`
      );

      if (!template) {
        console.error(`Template #${type}-project-card-template not found`);
        return;
      }

      const card = template.content.cloneNode(true);

      // Set project ID
      const projectCard = card.querySelector(".project-card");
      projectCard.dataset.id = organizedProject.id;

      // Set project name and status
      card.querySelector(".project-name").textContent = organizedProject.name;
      const statusSelect = card.querySelector(".status-select");
      statusSelect.value = organizedProject.status;

      // Добавляем data-атрибут для привязки к проекту
      statusSelect.setAttribute("data-project-id", organizedProject.id);

      // Обновляем классы статуса
      this.updateStatusClasses(statusSelect, organizedProject.status);

      // Set project details
      card.querySelector(".location").textContent = organizedProject.location;

      // Форматируем даты для отображения
      const startDateFormatted = this.formatDateForDisplay(
        organizedProject.startDate
      );
      const endDateFormatted = this.formatDateForDisplay(
        organizedProject.endDate
      );
      card.querySelector(
        ".dates"
      ).textContent = `${startDateFormatted} - ${endDateFormatted}`;

      if (type === "current") {
        this.renderCurrentProjectDetails(card, organizedProject, contractor);
      } else {
        this.renderFutureProjectDetails(card, organizedProject, contractor);
      }

      // Добавляем карточку в контейнер
      container.appendChild(card);
    });

    // After rendering all projects, update the statistics
    this.updateProjectStatistics(type);

    // Bind events to project cards
    this.bindProjectCardEvents(type);

    // Привязываем события к предпросмотрам файлов
    this.bindFilePreviewEvents();

    // Добавим дополнительную логику для обработки всех изображений на странице
    this.enhanceAllImagePreviews(type);
  }

  // Метод для улучшения всех превью изображений в указанной секции
  enhanceAllImagePreviews(type) {
    // Получаем контейнер для секции
    const sectionId =
      type === "current"
        ? "current-projects-section"
        : "future-projects-section";
    const section = this.container.querySelector(`#${sectionId}`);
    if (!section) return;

    // Находим все изображения в секции
    const images = section.querySelectorAll(".file-preview-container img");
    images.forEach((img) => {
      // Проверяем, что у изображения есть src
      const src = img.getAttribute("src");
      if (src) {
        // Делаем курсор указателем
        img.style.cursor = "pointer";

        // Удаляем старые обработчики, чтобы избежать дублирования
        const newImg = img.cloneNode(true);
        img.parentNode.replaceChild(newImg, img);

        // Добавляем обработчик клика
        newImg.addEventListener("click", () => {
          console.log("Image clicked:", src);
          this.showImageModal(src);
        });
      }
    });

    console.log(`Enhanced ${images.length} images in ${type} projects section`);
  }

  updateStatusClasses(statusSelect, status) {
    // Удаляем все существующие классы статуса
    statusSelect.classList.remove(
      "planned",
      "in-progress",
      "completed",
      "on-hold",
      "move-to-current",
      "delayed",
      "design-phase", // Добавляем новые возможные статусы
      "planning"
    );

    // Преобразуем статус для использования в качестве CSS класса (заменяем пробелы на дефисы)
    const statusClass = status.replace(/\s+/g, "-").toLowerCase();

    // Добавляем новый класс статуса
    statusSelect.classList.add(statusClass);

    // Сбрасываем inline стили, которые могли быть установлены ранее
    statusSelect.style.backgroundColor = "";
    statusSelect.style.color = "";
    statusSelect.style.borderColor = "";

    // Определяем цвета в зависимости от статуса
    let colors = {
      planned: {
        bg: "#e3f2fd",
        color: "#1976d2",
        border: "#90caf9",
      },
      "in-progress": {
        bg: "#fff3e0",
        color: "#f57c00",
        border: "#ffcc80",
      },
      completed: {
        bg: "#e8f5e9",
        color: "#388e3c",
        border: "#a5d6a7",
      },
      "on-hold": {
        bg: "#ffebee",
        color: "#d32f2f",
        border: "#ef9a9a",
      },
      "move-to-current": {
        bg: "#f3e5f5",
        color: "#7b1fa2",
        border: "#ce93d8",
      },
      delayed: {
        bg: "#ffebee",
        color: "#d32f2f",
        border: "#ef9a9a",
      },
      "design-phase": {
        // Добавляем новые статусы с цветами
        bg: "#e0f7fa",
        color: "#0097a7",
        border: "#80deea",
      },
      planning: {
        bg: "#f3e5f5",
        color: "#8e24aa",
        border: "#ce93d8",
      },
    };

    // Пробуем найти цвета для статуса напрямую или для его CSS версии
    let colorConfig = colors[status] || colors[statusClass];

    // Применяем стили, если статус найден в нашем объекте
    if (colorConfig) {
      statusSelect.style.backgroundColor = colorConfig.bg;
      statusSelect.style.color = colorConfig.color;
      statusSelect.style.borderColor = colorConfig.border;
      statusSelect.style.borderWidth = "1px";
      statusSelect.style.borderStyle = "solid";
    } else {
      // Если статус неизвестен, применяем стандартные стили
      statusSelect.style.backgroundColor = "#f5f5f5";
      statusSelect.style.color = "#616161";
      statusSelect.style.borderColor = "#bdbdbd";
      statusSelect.style.borderWidth = "1px";
      statusSelect.style.borderStyle = "solid";
    }

    // Устанавливаем data-атрибут для дополнительной поддержки селекторов
    statusSelect.setAttribute("data-status", status);
  }

  // Helper method to update card size after toggle
  updateCardSize(card) {
    // Ensure card is a DOM element
    if (!card || typeof card.closest !== "function") {
      // If card is not a DOM element, try to find the project card differently
      // This handles cases where 'card' might be the project card body or another element
      const projectCard = card.parentElement
        ? card.parentElement.closest(".project-card")
        : document.querySelector(".project-card");

      if (projectCard) {
        // Set height to auto to let it resize naturally
        projectCard.style.height = "auto";
        const cardBody = projectCard.querySelector(".card-body");
        if (cardBody) {
          cardBody.style.height = "auto";
        }
      }
      return;
    }

    // Regular handling if card is a DOM element with closest method
    const projectCard = card.closest(".project-card");
    if (projectCard) {
      // Ensure card body expands/contracts with content
      const cardBody = projectCard.querySelector(".card-body");
      if (cardBody) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          // Reset any fixed heights
          cardBody.style.height = "";
          projectCard.style.height = "";

          // Calculate and set new height
          const height = cardBody.scrollHeight;
          cardBody.style.height = height + "px";

          // Allow height to adjust naturally after initial animation
          setTimeout(() => {
            cardBody.style.height = "auto";
          }, 300);
        }, 10);
      }
    }
  }

  renderCurrentProjectDetails(card, project, contractor) {
    // Set current project specific details
    card.querySelector(".progress").textContent = project.progress
      ? `${project.progress}%`
      : "Not started";
    card.querySelector(".actual-cost").textContent = project.actualCost
      ? `$${project.actualCost.toLocaleString()}`
      : "Not specified";
    card.querySelector(".contractor").textContent = contractor
      ? contractor.companyName
      : "Not assigned";
    card.querySelector(".project-manager").textContent =
      contractor && contractor.contactPerson
        ? `${contractor.contactPerson.name} (${contractor.contactPerson.position})`
        : "Not assigned";

    // Форматируем дату последнего обновления
    const lastUpdateFormatted = project.lastUpdate
      ? this.formatDateForDisplay(project.lastUpdate)
      : "Not updated";
    card.querySelector(".last-update").textContent = lastUpdateFormatted;

    // Определяем, является ли проект перенесенным из Future в Current
    const isMigratedProject =
      project.description ||
      project.objectives ||
      project.risks ||
      project.priority ||
      (project.specifications && project.specifications.length > 0) ||
      (project.budgetDocs && project.budgetDocs.length > 0) ||
      (project.documents &&
        project.documents.length > 0 &&
        project.migratedFromFuture);

    const detailsSection = card.querySelector(".project-details");

    // Make Project Documents header collapsible
    const documentsSection = detailsSection.querySelector(
      ".details-section:last-child"
    );
    const docHeader = documentsSection.querySelector("h4");

    // Make header collapsible
    docHeader.classList.add("collapsible-header");
    const documentsGrid = documentsSection.querySelector(".documents-grid");
    documentsGrid.classList.add("collapsible-content");

    // Add click event to toggle
    docHeader.addEventListener("click", (e) => {
      e.preventDefault();
      docHeader.classList.toggle("collapsed");
      documentsGrid.classList.toggle("collapsed");

      // Update card size after toggle - pass the project card element
      this.updateCardSize(docHeader.closest(".project-card"));
    });

    // Reorganize documents grid - group migrated files at the top
    if (isMigratedProject) {
      // Clear existing content
      documentsGrid.innerHTML = "";

      // Add a collapsible header for migrated files
      const migratedHeader = document.createElement("div");
      migratedHeader.className = "section-header";
      migratedHeader.innerHTML = `
        <h4 class="toggle-documents">
          <i class="fas fa-chevron-down"></i> 
          <span class="from-future-flag">From Future Project</span>
        </h4>
      `;
      documentsGrid.appendChild(migratedHeader);

      // Create migrated files group
      const migratedFilesGroup = document.createElement("div");
      migratedFilesGroup.className = "migrated-files-group documents-content";
      documentsGrid.appendChild(migratedFilesGroup);

      // Make sure content is fully visible with scrolling if needed
      migratedFilesGroup.style.overflowY = "visible";
      migratedFilesGroup.style.maxHeight = "none";
      documentsGrid.style.overflowY = "visible";

      // Add Planning Documents (formerly called Documents in Future Projects) if they exist
      if (
        project.documents &&
        project.documents.length > 0 &&
        project.migratedFromFuture
      ) {
        const planningDocsGroup = document.createElement("div");
        planningDocsGroup.className = "documents-group migrated-files";
        planningDocsGroup.innerHTML = `
          <h5>Planning Documents</h5>
          <div class="planning-docs-preview file-preview-container">
            ${this.renderFilePreviews(project.documents, "document")}
          </div>
        `;
        migratedFilesGroup.appendChild(planningDocsGroup);
      }

      // Add specifications if they exist
      if (project.specifications && project.specifications.length > 0) {
        const specificationsGroup = document.createElement("div");
        specificationsGroup.className = "documents-group migrated-files";
        specificationsGroup.innerHTML = `
          <h5>Specifications</h5>
          <div class="specifications-preview file-preview-container">
            ${this.renderFilePreviews(project.specifications, "specification")}
          </div>
        `;
        migratedFilesGroup.appendChild(specificationsGroup);
      }

      // Add budget documents if they exist
      if (project.budgetDocs && project.budgetDocs.length > 0) {
        const budgetDocsGroup = document.createElement("div");
        budgetDocsGroup.className = "documents-group migrated-files";
        budgetDocsGroup.innerHTML = `
          <h5>Budget Documents</h5>
          <div class="budget-docs-preview file-preview-container">
            ${this.renderFilePreviews(project.budgetDocs, "budgetDoc")}
          </div>
        `;
        migratedFilesGroup.appendChild(budgetDocsGroup);
      }

      // Add a collapsible header for current files
      const currentHeader = document.createElement("div");
      currentHeader.className = "section-header";
      currentHeader.innerHTML = `
        <h4 class="toggle-documents">
          <i class="fas fa-chevron-down"></i> 
          <span class="current-files-title">Current Project Files</span>
        </h4>
      `;
      documentsGrid.appendChild(currentHeader);

      // Create current files group
      const currentFilesGroup = document.createElement("div");
      currentFilesGroup.className = "current-files-group documents-content";
      documentsGrid.appendChild(currentFilesGroup);

      // Add current files (Photos, Reports)
      // Photos
      if (project.photos && project.photos.length > 0) {
        const photosGroup = document.createElement("div");
        photosGroup.className = "documents-group";
        photosGroup.innerHTML = `
          <h5>Photos</h5>
          <div class="photos-preview file-preview-container">
            ${this.renderFilePreviews(project.photos, "photo")}
          </div>
        `;
        currentFilesGroup.appendChild(photosGroup);
      } else {
        const photosGroup = document.createElement("div");
        photosGroup.className = "documents-group";
        photosGroup.innerHTML = `
          <h5>Photos</h5>
          <div class="photos-preview file-preview-container"></div>
        `;
        currentFilesGroup.appendChild(photosGroup);
      }

      // Reports
      if (project.reports && project.reports.length > 0) {
        const reportsGroup = document.createElement("div");
        reportsGroup.className = "documents-group";
        reportsGroup.innerHTML = `
          <h5>Reports</h5>
          <div class="reports-preview file-preview-container">
            ${this.renderFilePreviews(project.reports, "report")}
          </div>
        `;
        currentFilesGroup.appendChild(reportsGroup);
      } else {
        const reportsGroup = document.createElement("div");
        reportsGroup.className = "documents-group";
        reportsGroup.innerHTML = `
          <h5>Reports</h5>
          <div class="reports-preview file-preview-container"></div>
        `;
        currentFilesGroup.appendChild(reportsGroup);
      }

      // Add toggle functionality for each section individually
      const toggleSections = card.querySelectorAll(".toggle-documents");
      toggleSections.forEach((toggle) => {
        toggle.addEventListener("click", (e) => {
          const content = toggle.closest(".section-header").nextElementSibling;
          content.classList.toggle("collapsed");
          const icon = toggle.querySelector("i");
          icon.classList.toggle("fa-chevron-down");
          icon.classList.toggle("fa-chevron-right");

          // Update card size after toggle
          this.updateCardSize(toggle.closest(".project-card"));
        });
      });
    } else {
      // Just set file previews without reorganization
      if (project.photos && project.photos.length > 0) {
        card.querySelector(".photos-preview").innerHTML =
          this.renderFilePreviews(project.photos, "photo");
      }
      if (project.documents && project.documents.length > 0) {
        card.querySelector(".documents-preview").innerHTML =
          this.renderFilePreviews(project.documents, "document");
      }
      if (project.reports && project.reports.length > 0) {
        card.querySelector(".reports-preview").innerHTML =
          this.renderFilePreviews(project.reports, "report");
      }
    }
  }

  renderFutureProjectDetails(card, project, contractor) {
    // Future project specific details
    card.querySelector(".budget").textContent = project.budget
      ? `$${project.budget.toLocaleString()}`
      : "Not specified";
    card.querySelector(".priority").textContent = project.priority
      ? project.priority.charAt(0).toUpperCase() + project.priority.slice(1)
      : "Not specified";
    card.querySelector(".preferred-contractor").textContent = contractor
      ? contractor.companyName
      : "Not assigned";
    card.querySelector(".project-manager").textContent =
      contractor && contractor.contactPerson
        ? `${contractor.contactPerson.name} (${contractor.contactPerson.position})`
        : "Not assigned";

    // Set planning details
    card.querySelector(".description").textContent =
      project.description || "No description available";
    card.querySelector(".objectives").textContent =
      project.objectives || "No objectives defined";
    card.querySelector(".risks").textContent =
      project.risks || "No risks identified";

    // Make Project Documents header collapsible
    const detailsSection = card.querySelector(".project-details");
    const documentsSection = detailsSection.querySelector(
      ".details-section:last-child"
    );
    const docHeader = documentsSection.querySelector("h4");

    // Make header collapsible
    docHeader.classList.add("collapsible-header");
    const documentsGrid = documentsSection.querySelector(".documents-grid");
    documentsGrid.classList.add("collapsible-content");

    // Add click event to toggle
    docHeader.addEventListener("click", (e) => {
      e.preventDefault();
      docHeader.classList.toggle("collapsed");
      documentsGrid.classList.toggle("collapsed");

      // Update card size after toggle
      this.updateCardSize(card);
    });

    // Set file previews
    if (project.documents && project.documents.length > 0) {
      card.querySelector(".documents-preview").innerHTML =
        this.renderFilePreviews(project.documents, "document");
    }
    if (project.specifications && project.specifications.length > 0) {
      card.querySelector(".specifications-preview").innerHTML =
        this.renderFilePreviews(project.specifications, "specification");
    }
  }

  getFileIcon(fileType) {
    if (fileType.startsWith("image/")) return "fas fa-image";
    if (fileType.includes("pdf")) return "fas fa-file-pdf";
    if (fileType.includes("word")) return "fas fa-file-word";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "fas fa-file-excel";
    return "fas fa-file";
  }

  addFilePreview(file, container, type) {
    // Проверяем, существует ли файл
    if (!file) return;

    console.log("Adding file preview:", file); // Для отладки

    // Получаем имя файла, используя свойства originalName или name
    const fileName =
      file.originalName && file.originalName.trim() !== ""
        ? file.originalName
        : file.name && file.name.trim() !== ""
        ? file.name
        : `${type.charAt(0).toUpperCase() + type.slice(1)} File`;

    // Создаем элемент для превью файла
    const previewItem = document.createElement("div");
    previewItem.className = "file-preview-item";
    previewItem.dataset.fileType = type;
    previewItem.dataset.fileName = fileName;

    // Всегда устанавливаем тип MIME для фотографий
    if (type === "photo") {
      previewItem.dataset.mimeType = file.type || "image/jpeg";
    } else {
      previewItem.dataset.mimeType = file.type || "application/octet-stream";
    }

    // Проверяем, является ли файл изображением - для фото это всегда true
    const isImage =
      type === "photo" ||
      file.type?.startsWith("image/") ||
      (fileName && fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif)$/i));

    console.log("Is image:", isImage, "Type:", type, "File type:", file.type); // Для отладки

    // Если это изображение, создаем превью
    if (isImage) {
      const img = document.createElement("img");
      try {
        // Используем существующий URL или создаем новый
        if (file.src) {
          console.log("Using existing src:", file.src); // Для отладки
          img.src = file.src;
        } else if (file instanceof Blob || file instanceof File) {
          console.log("Creating new blob URL"); // Для отладки
          const imgUrl = URL.createObjectURL(file);
          img.src = imgUrl;
          previewItem.dataset.imgUrl = imgUrl; // Сохраняем URL для последующего освобождения
        } else if (file.file instanceof Blob || file.file instanceof File) {
          // Иногда файл может быть обернут в объект с полем file
          console.log("Creating new blob URL from file.file"); // Для отладки
          const imgUrl = URL.createObjectURL(file.file);
          img.src = imgUrl;
          previewItem.dataset.imgUrl = imgUrl;
        } else {
          // Если у нас нет прямого доступа к блобу, попробуем использовать base64 или путь к файлу
          console.log("Trying to use file data or path"); // Для отладки
          if (file.data) {
            // Если есть данные в base64
            img.src = file.data;
          } else if (file.path) {
            // Если есть путь к файлу
            img.src = file.path;
          } else if (file.miniUrl) {
            // Если есть путь к миниатюре
            img.src = file.miniUrl;
          } else if (file.url) {
            // Если есть путь к полноразмерному файлу
            img.src = file.url;
          } else if (fileName) {
            // Последняя попытка - формируем путь по имени файла
            img.src = `components/construction/project_upload/project_mini/mini_${fileName}`;
          } else {
            // Последняя попытка - если файл - это строка с URL или данными base64
            img.src = typeof file === "string" ? file : "";
          }
        }

        // Улучшенная обработка ошибок загрузки изображения
        img.onerror = () => {
          console.error("Error loading image:", img.src);
          img.remove();
          // Если не удалось загрузить изображение, используем иконку
          const iconDiv = document.createElement("div");
          iconDiv.className = "file-type-icon";
          iconDiv.innerHTML = `<i class="fas fa-image"></i>`;
          previewItem.appendChild(iconDiv);
        };

        // Убедимся, что изображение добавится в DOM даже если оно закэшировано и onload не сработает
        if (img.complete) {
          previewItem.appendChild(img);
        } else {
          img.onload = () => {
            // Изображение успешно загрузилось
            console.log("Image loaded successfully:", img.src);
          };
          previewItem.appendChild(img);
        }
      } catch (error) {
        console.error("Ошибка создания превью изображения:", error);
        // Если не удалось создать превью, используем иконку
        const iconDiv = document.createElement("div");
        iconDiv.className = "file-type-icon";
        iconDiv.innerHTML = `<i class="fas fa-image"></i>`;
        previewItem.appendChild(iconDiv);
      }
    } else {
      // Для не-изображений показываем иконку типа файла
      const iconDiv = document.createElement("div");
      iconDiv.className = "file-type-icon";
      const fileIcon = this.getFileIcon(
        file.type || "application/octet-stream"
      );
      iconDiv.innerHTML = `<i class="${fileIcon}"></i>`;
      previewItem.appendChild(iconDiv);
    }

    // Добавляем имя файла
    const nameElement = document.createElement("div");
    nameElement.className = "file-name";
    nameElement.textContent = fileName;
    previewItem.appendChild(nameElement);

    // Добавляем скрытое поле для хранения оригинального имени, если оно есть
    if (file.originalName && file.originalName !== fileName) {
      previewItem.dataset.originalFileName = file.originalName;
    }

    // Добавляем кнопку удаления
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-file";
    removeBtn.innerHTML = "×";
    removeBtn.title = "Remove file";
    previewItem.appendChild(removeBtn);

    // Добавляем превью в контейнер
    container.appendChild(previewItem);

    // Привязываем события к новому превью
    this.bindFilePreviewEvents(container);
  }

  bindProjectCardEvents(type) {
    // Status change handler
    const statusSelects = document.querySelectorAll(`.status-select`);
    statusSelects.forEach((select) => {
      select.addEventListener("change", (e) => {
        e.stopPropagation();
        // Получаем ID проекта из ближайшей карточки
        const projectCard = e.target.closest(".project-card");
        const projectId = parseInt(projectCard.dataset.id);
        const newStatus = e.target.value;

        // Определяем тип проекта на основе родительского контейнера
        const projectsList = projectCard.closest(".projects-grid");
        const projectType =
          projectsList.id === "current-projects-list" ? "current" : "future";

        this.updateProjectStatus(projectId, newStatus, projectType);
      });
    });

    // Add click handler for project card images
    const projectCards = document.querySelectorAll(".project-card");
    projectCards.forEach((card) => {
      const cardImage = card.querySelector(".project-image img");
      if (cardImage) {
        cardImage.addEventListener("click", (e) => {
          e.stopPropagation();
          const imageSrc = cardImage.src;
          if (imageSrc) {
            this.showImageModal(imageSrc);
          }
        });
      }
    });

    // Toggle details button handler
    const toggleButtons = document.querySelectorAll(".btn-toggle-details");
    toggleButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const projectCard = e.target.closest(".project-card");
        if (projectCard) {
          const detailsSection = projectCard.querySelector(".project-details");
          if (detailsSection) {
            button.classList.toggle("active");
            detailsSection.classList.toggle("active");
            const icon = button.querySelector("i");
            if (icon) {
              icon.style.transform = button.classList.contains("active")
                ? "rotate(180deg)"
                : "rotate(0)";
            }

            // Если детали были открыты, добавляем обработчики для файловых превью
            if (detailsSection.classList.contains("active")) {
              this.bindFilePreviewEvents(detailsSection);
            }
          }
        }
      });
    });

    // Edit project handler
    this.container.querySelectorAll(".edit-project").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const projectCard = button.closest(".project-card");
        const projectId = parseInt(projectCard.dataset.id);
        const projectsList = projectCard.closest(".projects-grid");
        const projectType =
          projectsList.id === "current-projects-list" ? "current" : "future";
        const project = this.getProjectById(projectId, projectType);
        if (project) {
          this.showProjectModal(projectType, project);
        }
      });
    });

    // Delete project handler
    this.container.querySelectorAll(".delete-project").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const projectCard = button.closest(".project-card");
        const projectId = parseInt(projectCard.dataset.id);
        const projectsList = projectCard.closest(".projects-grid");
        const projectType =
          projectsList.id === "current-projects-list" ? "current" : "future";
        if (confirm("Are you sure you want to delete this project?")) {
          this.deleteProject(projectId, projectType);
        }
      });
    });
  }

  // Добавляем новый метод для привязки обработчиков к превью файлов
  bindFilePreviewEvents(container = null) {
    // Если контейнер не указан, привязываем обработчики ко всем превью файлов
    if (!container) {
      // Получаем все контейнеры с превью файлов
      const containers = this.container.querySelectorAll(
        ".file-preview-container"
      );
      containers.forEach((container) => this.bindFilePreviewEvents(container));
      return;
    }

    // Handle clicks on file preview items
    const fileItems = container.querySelectorAll(".file-preview-item");

    fileItems.forEach((item) => {
      // Get file info
      const fileId = item.dataset.fileId;
      const filePath = item.dataset.filePath;
      const mimeType = item.dataset.mimeType;

      // View file button - open in new tab or in modal
      const viewButton = item.querySelector(".view-file");
      if (viewButton) {
        viewButton.addEventListener("click", (e) => {
          e.stopPropagation();
          console.log("Opening file:", filePath);

          if (mimeType && mimeType.startsWith("image/")) {
            // Show image in modal
            this.showImageModal(filePath);
          } else {
            // Open other file types in a new tab
            window.open(filePath, "_blank");
          }
        });
      }

      // Remove file button - delete file from project
      const removeButton = item.querySelector(".remove-file");
      if (removeButton) {
        removeButton.addEventListener("click", (e) => {
          e.stopPropagation();
          if (confirm("Are you sure you want to delete this file?")) {
            console.log("Deleting file:", fileId);
            this.deleteProjectFile(fileId);
          }
        });
      }

      // Click on image thumbnail - show in modal
      const imgElement = item.querySelector("img");
      if (imgElement && mimeType && mimeType.startsWith("image/")) {
        imgElement.addEventListener("click", (e) => {
          e.stopPropagation();
          this.showImageModal(filePath);
        });
      }

      // Make the whole item clickable for images
      if (mimeType && mimeType.startsWith("image/")) {
        item.style.cursor = "pointer";
        item.addEventListener("click", () => {
          this.showImageModal(filePath);
        });
      }
    });

    // Также обработаем отдельные изображения, которые могут быть добавлены
    // напрямую в контейнер превью (не в .file-preview-item)
    const directImages = container.querySelectorAll(
      "img:not(.file-preview-item img)"
    );
    directImages.forEach((img) => {
      const src = img.getAttribute("src");
      if (src) {
        img.style.cursor = "pointer";
        img.addEventListener("click", () => {
          this.showImageModal(src);
        });
      }
    });
  }

  // Show image in modal
  showImageModal(imageSrc) {
    // Use the existing image modal in the HTML
    const imageModal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");

    if (imageModal && modalImage) {
      // Set image source and show modal
      modalImage.src = imageSrc;
      imageModal.style.display = "block";

      // Add Escape key handler
      const escKeyHandler = (e) => {
        if (e.key === "Escape") {
          imageModal.style.display = "none";
          document.removeEventListener("keydown", escKeyHandler);
        }
      };
      document.addEventListener("keydown", escKeyHandler);

      // Make sure close button works
      const closeBtn = imageModal.querySelector(".close-modal");
      if (closeBtn) {
        // Remove any existing handlers to prevent duplicates
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

        newCloseBtn.addEventListener("click", () => {
          imageModal.style.display = "none";
          document.removeEventListener("keydown", escKeyHandler);
        });
      }

      // Close on click outside the image
      const clickOutsideHandler = (e) => {
        if (e.target === imageModal) {
          imageModal.style.display = "none";
          imageModal.removeEventListener("click", clickOutsideHandler);
          document.removeEventListener("keydown", escKeyHandler);
        }
      };

      // Remove any existing handlers to prevent duplicates
      imageModal.removeEventListener("click", clickOutsideHandler);
      imageModal.addEventListener("click", clickOutsideHandler);
    } else {
      // Fallback to the old implementation if the HTML modal is not found
      // Create modal if it doesn't exist
      let modal = document.querySelector(".image-preview-modal");

      if (!modal) {
        modal = document.createElement("div");
        modal.className = "image-preview-modal";
        modal.innerHTML = `
          <div class="image-preview-content">
            <span class="image-preview-close">&times;</span>
            <img class="image-preview-img">
          </div>
        `;
        document.body.appendChild(modal);

        // Add close functionality
        const closeBtn = modal.querySelector(".image-preview-close");
        closeBtn.addEventListener("click", () => {
          modal.style.display = "none";
        });

        // Close on click outside the image
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.style.display = "none";
          }
        });

        // Add Escape key handler
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && modal.style.display === "block") {
            modal.style.display = "none";
          }
        });
      }

      // Set image source and show modal
      const img = modal.querySelector(".image-preview-img");
      img.src = imageSrc;
      modal.style.display = "block";
    }
  }

  // Delete project file
  deleteProjectFile(fileId) {
    if (!fileId) return;

    fetch(
      `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/files.php?id=${fileId}`,
      {
        method: "DELETE",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("File deleted successfully");
          // Refresh the current view
          const activeSection = this.activeTab || "current-projects";
          const type =
            activeSection === "current-projects" ? "current" : "future";

          // Reload the respective projects
          if (type === "current") {
            this.loadCurrentProjects().then(() =>
              this.renderProjects("current")
            );
          } else {
            this.loadFutureProjects().then(() => this.renderProjects("future"));
          }
        } else {
          alert("Error deleting file: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error deleting file:", error);
        alert("Error deleting file. Please try again.");
      });
  }

  handleProjectAction(projectId, action) {
    const projectCard = document.querySelector(
      `.project-card[data-project-id="${projectId}"]`
    );
    if (!projectCard) return;

    const projectsList = projectCard.closest(".projects-grid");
    const projectType =
      projectsList.id === "current-projects-list" ? "current" : "future";
    const project = this.getProjectById(projectId, projectType);

    if (!project) return;

    switch (action) {
      case "edit":
        this.showProjectModal(projectType, project);
        break;
      case "delete":
        if (confirm("Are you sure you want to delete this project?")) {
          this.deleteProject(projectId, projectType);
        }
        break;
      default:
        console.warn("Unknown project action:", action);
    }
  }

  showFilePreview(file) {
    const modal = this.container.querySelector(".preview-modal");
    const previewContent = modal.querySelector(".preview-content img");

    if (file.type.startsWith("image/")) {
      previewContent.src = URL.createObjectURL(file);
      modal.classList.add("active");
    } else {
      // For non-image files, you might want to show a different preview or download option
      window.open(URL.createObjectURL(file), "_blank");
    }
  }

  closeFilePreview() {
    const modal = this.container.querySelector(".preview-modal");
    const previewContent = modal.querySelector(".preview-content img");

    if (previewContent.src) {
      URL.revokeObjectURL(previewContent.src);
    }

    modal.classList.remove("active");
  }

  getProjectById(id, type) {
    // Убедимся, что id - это число
    id = parseInt(id);

    if (isNaN(id)) {
      console.error("Invalid project ID:", id);
      return null;
    }

    const projects =
      type === "current" ? this.currentProjects : this.futureProjects;
    return projects.find((p) => p.id === id) || null;
  }

  // Метод для синхронизации удаленных файлов в перенесенном проекте
  syncDeletedFiles(sourceProject, targetProject) {
    if (!sourceProject || !targetProject) return targetProject;

    // Синхронизируем Photos
    if (
      targetProject.photos &&
      Array.isArray(targetProject.photos) &&
      sourceProject.photos &&
      Array.isArray(sourceProject.photos)
    ) {
      // Создаем карту файлов из исходного проекта
      const sourcePhotoMap = {};
      sourceProject.photos.forEach((photo) => {
        if (photo && photo.name) {
          const key = photo.name || photo.originalName;
          sourcePhotoMap[key] = true;
        }
      });

      // Фильтруем фотографии, оставляя только те, которые есть в исходном проекте
      targetProject.photos = targetProject.photos.filter((photo) => {
        if (!photo) return false;
        const key = photo.name || photo.originalName;
        return sourcePhotoMap[key];
      });
    }

    // Синхронизируем Specifications
    if (sourceProject.specifications && targetProject.specifications) {
      const sourceFileMap = {};
      sourceProject.specifications.forEach((file) => {
        const key = `${file.name}-${file.type}`;
        sourceFileMap[key] = true;
      });

      targetProject.specifications = targetProject.specifications.filter(
        (file) => {
          const key = `${file.name}-${file.type}`;
          return sourceFileMap[key];
        }
      );

      // Пометим все specifications как мигрированные
      targetProject.specifications = targetProject.specifications.map(
        (file) => {
          return { ...file, migratedFromFuture: true };
        }
      );
    }

    // Синхронизируем Documents - копируем документы из исходного проекта в целевой
    if (sourceProject.documents && targetProject.documents) {
      const sourceFileMap = {};
      sourceProject.documents.forEach((file) => {
        const key = `${file.name}-${file.type}`;
        sourceFileMap[key] = true;
      });

      targetProject.documents = targetProject.documents.filter((file) => {
        const key = `${file.name}-${file.type}`;
        return sourceFileMap[key];
      });

      // Mark all documents as migrated from future
      targetProject.documents = targetProject.documents.map((file) => {
        return { ...file, migratedFromFuture: true };
      });
    }

    return targetProject;
  }

  // Method to synchronize deleted photos between card and edit form
  syncDeletedPhotos(fileItem, project) {
    if (!project || !fileItem) return;

    const fileType = fileItem.dataset.fileType;
    const fileName = fileItem.dataset.fileName;

    if (!fileName) return;

    // Determine which array to update based on file type
    let fileArray;
    switch (fileType) {
      case "photo":
        fileArray = project.photos;
        break;
      case "document":
        fileArray = project.documents;
        break;
      case "report":
        fileArray = project.reports;
        break;
      case "specification":
        fileArray = project.specifications;
        break;
      case "budgetDoc":
        fileArray = project.budgetDocs;
        break;
      default:
        return;
    }

    // Remove the file from the array if it exists
    if (fileArray && Array.isArray(fileArray)) {
      const index = fileArray.findIndex(
        (file) => file.name === fileName || file.originalName === fileName
      );
      if (index !== -1) {
        fileArray.splice(index, 1);
      }
    }
  }

  // Method to display image preview in modal
  showFilePreviewModal(imageSrc) {
    const modal = this.container.querySelector(".preview-modal");
    if (!modal) return;

    const previewImage = modal.querySelector("img");
    if (previewImage) {
      previewImage.src = imageSrc;

      // Add error handler in case the image fails to load
      previewImage.onerror = () => {
        console.error("Failed to load image:", imageSrc);
        previewImage.src = ""; // Clear the source to prevent further errors
        modal.style.display = "none";
      };

      // Display the modal
      modal.style.display = "flex";

      // Add event listener to close button if not already added
      const closeButton = modal.querySelector(".close-preview");
      if (closeButton && !closeButton.hasClickListener) {
        closeButton.addEventListener("click", () => {
          modal.style.display = "none";
        });
        closeButton.hasClickListener = true;
      }

      // Add event listener to close modal on background click
      if (!modal.hasClickListener) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.style.display = "none";
          }
        });
        modal.hasClickListener = true;
      }
    }
  }

  // Methods for formatting dates
  formatDateForDisplay(dateString) {
    if (!dateString) return "";

    // Поддержка различных форматов даты
    let date;

    if (typeof dateString === "object" && dateString instanceof Date) {
      date = dateString;
    } else {
      // Проверяем формат YYYY-MM-DD (из базы данных)
      if (
        typeof dateString === "string" &&
        dateString.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        const [year, month, day] = dateString.split("-");
        date = new Date(year, month - 1, day);
      } else {
        // Пытаемся разобрать строку как дату
        date = new Date(dateString);
      }
    }

    // Проверяем, что получилась корректная дата
    if (isNaN(date.getTime())) return "";

    // Форматируем дату в формат MM/DD/YYYY
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  }

  // Функция для преобразования даты в формат YYYY-MM-DD для API
  formatDateForAPI(dateString) {
    if (!dateString || typeof dateString !== "string") {
      return null; // Return null for empty values instead of passing through
    }

    // Проверяем формат даты MM/DD/YYYY и преобразуем в YYYY-MM-DD
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [month, day, year] = dateString.split("/");
      return `${year}-${month}-${day}`;
    }

    // Check MM-DD-YYYY format
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [month, day, year] = dateString.split("-");
      return `${year}-${month}-${day}`;
    }

    // Already in YYYY-MM-DD format
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }

    // Try to parse with Date object as fallback
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
      }
    } catch (e) {
      console.error("Error parsing date:", e);
    }

    // If all else fails, return null to avoid database errors
    return null;
  }

  // Method to initialize the ratings system
  setupRatingHandlers() {
    // Handle star rating in contractor list
    this.container.addEventListener("click", (e) => {
      const star = e.target.closest(".star, .fa-star");
      if (star) {
        // Handle star clicks in the contractor cards (list view)
        const contractorCard = star.closest(".contractor-card");
        if (contractorCard) {
          const contractorId = parseInt(contractorCard.dataset.id);
          const rating = parseInt(
            star.dataset.rating || star.parentElement.dataset.rating
          );
          this.setContractorRating(contractorId, rating);
        }

        // Handle star clicks in the contractor modal (add/edit form)
        const ratingContainer = star.closest(".rating");
        if (ratingContainer && !contractorCard) {
          const modal = star.closest("#contractor-modal");
          if (modal) {
            const rating = parseInt(
              star.dataset.rating || star.parentElement.dataset.rating
            );
            const form = modal.querySelector("#contractor-form");

            // Update hidden input value
            form.elements.rating.value = rating;

            // Update stars visual representation
            ratingContainer.querySelectorAll("i").forEach((icon, index) => {
              if (index < rating) {
                icon.className = "fas fa-star";
              } else {
                icon.className = "far fa-star";
              }
            });
          }
        }
      }
    });
  }

  // Helper method to generate star rating HTML
  generateRatingStars(rating, interactive = true) {
    const maxRating = 5;
    let starsHtml = "";

    for (let i = 1; i <= maxRating; i++) {
      const starClass = i <= rating ? "fas fa-star" : "far fa-star";
      starsHtml += `<span class="star ${
        interactive ? "interactive" : ""
      }" data-rating="${i}"><i class="${starClass}"></i></span>`;
    }

    return starsHtml;
  }

  // Method to handle changing contractor rating
  handleRating(contractorId, rating) {
    this.setContractorRating(contractorId, rating);
  }

  // Method to set contractor rating
  setContractorRating(contractorId, rating) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      contractor.rating = rating;
      this.renderContractors();

      // Here should be API call to update rating
    }
  }

  // Method to update project statistics
  updateProjectStatistics(type) {
    const projects =
      type === "current" ? this.currentProjects : this.futureProjects;
    const statsContainer = this.container.querySelector(
      `#${type}-projects-stats`
    );

    if (!statsContainer) return;

    // Calculate statistics
    const totalProjects = projects.length;
    const statusCounts = {
      planned: 0,
      "in-progress": 0,
      "In Progress": 0,
      completed: 0,
      "on-hold": 0,
      delayed: 0,
      "move-to-current": 0,
      "Design Phase": 0,
      "design-phase": 0,
      Planning: 0,
      planning: 0,
    };

    // Приоритеты для будущих проектов
    const priorityCounts = {
      high: 0,
      medium: 0,
      low: 0,
    };

    // Count projects by status and priority
    projects.forEach((project) => {
      if (project.status in statusCounts) {
        statusCounts[project.status]++;
      } else {
        // Проверяем нормализованную версию статуса (в нижнем регистре с дефисами вместо пробелов)
        const normalizedStatus = project.status
          .toLowerCase()
          .replace(/\s+/g, "-");
        if (normalizedStatus in statusCounts) {
          statusCounts[normalizedStatus]++;
        }
      }

      // Подсчитываем проекты по приоритету для Future Projects
      if (type === "future" && project.priority in priorityCounts) {
        priorityCounts[project.priority]++;
      }
    });

    // Комбинируем счетчики для статусов с разными форматами написания
    const completedCount = statusCounts["completed"];
    const inProgressCount =
      statusCounts["in-progress"] + statusCounts["In Progress"];
    const onHoldCount = statusCounts["on-hold"];
    const delayedCount = statusCounts["delayed"];
    const designPhaseCount =
      statusCounts["Design Phase"] + statusCounts["design-phase"];
    const planningCount = statusCounts["Planning"] + statusCounts["planning"];

    // Разные шаблоны для Current и Future Projects
    if (type === "current") {
      // Update the stats display for Current Projects
      statsContainer.innerHTML = `
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">Total Projects:</span>
            <span class="stat-value" id="current-projects-total">${totalProjects}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Completed:</span>
            <span class="stat-value stat-completed" id="current-projects-completed">${completedCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">In Progress:</span>
            <span class="stat-value stat-in-progress" id="current-projects-in-progress">${inProgressCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Design Phase:</span>
            <span class="stat-value stat-design" id="current-projects-design">${designPhaseCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Planning:</span>
            <span class="stat-value stat-planning" id="current-projects-planning">${planningCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">On Hold:</span>
            <span class="stat-value stat-on-hold" id="current-projects-on-hold">${onHoldCount}</span>
          </div>
        </div>
      `;
    } else {
      // Update the stats display for Future Projects
      statsContainer.innerHTML = `
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">Total Planned:</span>
            <span class="stat-value" id="future-projects-total">${totalProjects}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">High Priority:</span>
            <span class="stat-value stat-high" id="future-projects-high">${priorityCounts["high"]}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Medium Priority:</span>
            <span class="stat-value stat-medium" id="future-projects-medium">${priorityCounts["medium"]}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Low Priority:</span>
            <span class="stat-value stat-low" id="future-projects-low">${priorityCounts["low"]}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Delayed:</span>
            <span class="stat-value stat-delayed" id="future-projects-delayed">${delayedCount}</span>
          </div>
        </div>
      `;
    }

    // Add styles if they don't exist
    if (!document.getElementById("project-stats-styles")) {
      const statsStyles = document.createElement("style");
      statsStyles.id = "project-stats-styles";
      statsStyles.innerHTML = `
        .stats-container {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .stat-item {
          text-align: center;
          padding: 0 15px;
          border-right: 1px solid #ddd;
          flex: 1;
        }
        
        .stat-item:last-child {
          border-right: none;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #0088cc;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 0.9rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-completed {
          color: #388e3c;
        }
        
        .stat-in-progress {
          color: #f57c00;
        }
        
        .stat-on-hold {
          color: #d32f2f;
        }
        
        .stat-high {
          color: #d32f2f;
        }
        
        .stat-medium {
          color: #f57c00;
        }
        
        .stat-low {
          color: #388e3c;
        }
        
        .stat-delayed {
          color: #d32f2f;
        }
        
        .stat-design {
          color: #0097a7;
        }
        
        .stat-planning {
          color: #8e24aa;
        }
      `;
      document.head.appendChild(statsStyles);
    }
  }

  // Method to setup search filters
  setupSearchFilters() {
    // Implement search functionality for each section
    const searchInputs = this.container.querySelectorAll(".search-input");
    searchInputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        const section = e.target.dataset.section;
        this.filters[section].search = e.target.value.toLowerCase().trim();
        this.applyFilters(section);
      });
    });

    // Business type filter for contractors
    const businessTypeFilter = this.container.querySelector(
      "#business-type-filter"
    );
    if (businessTypeFilter) {
      businessTypeFilter.addEventListener("change", (e) => {
        this.filters.contractors.businessType = e.target.value;
        this.applyFilters("contractors");
      });
    }

    // Rating filter for contractors
    const ratingFilter = this.container.querySelector("#rating-filter");
    if (ratingFilter) {
      ratingFilter.addEventListener("change", (e) => {
        this.filters.contractors.rating = e.target.value;
        this.applyFilters("contractors");
      });
    }
  }

  // Method to update business type filter options
  updateBusinessTypeFilter() {
    const businessTypeFilter = this.container.querySelector(
      "#business-type-filter"
    );
    if (!businessTypeFilter) return;

    // Get unique business types
    const businessTypes = [
      ...new Set(this.contractors.map((c) => c.businessType)),
    ].filter(Boolean);

    // Create options HTML
    const optionsHtml = `
      <option value="all">All Types</option>
      ${businessTypes
        .map((type) => `<option value="${type}">${type}</option>`)
        .join("")}
    `;

    // Update the select element
    businessTypeFilter.innerHTML = optionsHtml;
  }

  // Method to apply filters to a section
  applyFilters(section) {
    switch (section) {
      case "contractors":
        this.applyContractorFilters();
        break;
      case "current-projects":
        this.applyProjectFilters("current");
        break;
      case "future-projects":
        this.applyProjectFilters("future");
        break;
    }
  }

  // Method to apply contractor filters
  applyContractorFilters() {
    const filters = this.filters.contractors;
    let filteredContractors = [...this.contractors];

    // Apply search filter
    if (filters.search) {
      filteredContractors = filteredContractors.filter(
        (contractor) =>
          contractor.companyName.toLowerCase().includes(filters.search) ||
          contractor.businessType.toLowerCase().includes(filters.search) ||
          contractor.location.toLowerCase().includes(filters.search) ||
          contractor.email.toLowerCase().includes(filters.search) ||
          contractor.phone.toLowerCase().includes(filters.search)
      );
    }

    // Apply business type filter
    if (filters.businessType !== "all") {
      filteredContractors = filteredContractors.filter(
        (contractor) => contractor.businessType === filters.businessType
      );
    }

    // Apply rating filter
    if (filters.rating !== "all") {
      const ratingValue = parseInt(filters.rating);
      filteredContractors = filteredContractors.filter(
        (contractor) => contractor.rating === ratingValue
      );
    }

    // Render filtered contractors
    this.renderContractors(filteredContractors);
  }

  // Method to apply project filters
  applyProjectFilters(type) {
    const filters =
      this.filters[type === "current" ? "currentProjects" : "futureProjects"];
    const projects =
      type === "current" ? this.currentProjects : this.futureProjects;
    let filteredProjects = [...projects];

    // Apply search filter
    if (filters.search) {
      filteredProjects = filteredProjects.filter(
        (project) =>
          project.name.toLowerCase().includes(filters.search) ||
          project.location.toLowerCase().includes(filters.search)
      );
    }

    // Apply location filter
    if (filters.location) {
      filteredProjects = filteredProjects.filter((project) =>
        project.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Apply status/priority filter
    if (filters.status !== "all") {
      filteredProjects = filteredProjects.filter(
        (project) => project.status === filters.status
      );
    }

    // Apply date filter
    if (filters.date !== "all") {
      // Implement date filtering logic here
    }

    // Render filtered projects
    this.renderProjects(type, filteredProjects);
  }

  // Helper method to close all modals
  closeModals() {
    this.container.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.remove("active");
    });
  }

  // Method to show contractor modal for adding or editing
  showContractorModal(contractor = null) {
    const modal = this.container.querySelector("#contractor-modal");
    const form = modal.querySelector("#contractor-form");
    const title = modal.querySelector("#contractor-modal-title");

    // Reset the form to clear previous data
    form.reset();

    // Set the title based on whether we're adding or editing
    title.textContent = contractor ? "Edit Contractor" : "Add Contractor";

    // Fill the form with existing data if editing
    if (contractor) {
      form.elements.companyName.value = contractor.companyName || "";
      form.elements.businessType.value = contractor.businessType || "";
      form.elements.location.value = contractor.location || "";
      form.elements.email.value = contractor.email || "";
      form.elements.phone.value = contractor.phone || "";

      // Contact person details if available
      if (contractor.contactPerson) {
        form.elements.contactName.value = contractor.contactPerson.name || "";
        form.elements.position.value = contractor.contactPerson.position || "";
        form.elements.contactPhone.value = contractor.contactPerson.phone || "";
        form.elements.contactEmail.value = contractor.contactPerson.email || "";
      }

      // Set the rating
      const rating = parseInt(contractor.rating) || 0;
      form.elements.rating.value = rating;

      // Update the star icons to match the rating
      modal.querySelectorAll(".rating i").forEach((star, index) => {
        star.className = index < rating ? "fas fa-star" : "far fa-star";
      });

      // Store contractor ID for update
      form.dataset.contractorId = contractor.id;
    } else {
      // Clear any stored ID when adding new contractor
      delete form.dataset.contractorId;

      // Reset rating to 0
      form.elements.rating.value = 0;
      modal.querySelectorAll(".rating i").forEach((star) => {
        star.className = "far fa-star";
      });
    }

    // Show the modal
    modal.classList.add("active");
  }

  // Method to handle contractor form submission
  handleContractorSubmit(e) {
    e.preventDefault();
    const form = e.target;

    // Gather form data
    const contractorData = {
      companyName: form.elements.companyName.value,
      businessType: form.elements.businessType.value,
      location: form.elements.location.value,
      email: form.elements.email.value,
      phone: form.elements.phone.value,
      rating: parseInt(form.elements.rating.value) || 0,
      contactPerson: {
        name: form.elements.contactName.value,
        position: form.elements.position.value,
        phone: form.elements.contactPhone.value,
        email: form.elements.contactEmail.value,
      },
    };

    if (form.dataset.contractorId) {
      // Update existing contractor
      const contractorId = parseInt(form.dataset.contractorId);
      this.updateContractor(contractorId, contractorData);
    } else {
      // Create new contractor
      this.createContractor(contractorData);
    }

    // Close the modal
    this.closeModals();
  }

  updateContractor(contractorId, contractorData) {
    // Implement the logic to update an existing contractor
    // This might involve making an API call to update the contractor data
    console.log("Updating contractor:", contractorId, contractorData);
  }

  createContractor(contractorData) {
    // Implement the logic to create a new contractor
    // This might involve making an API call to create a new contractor
    console.log("Creating new contractor:", contractorData);
  }

  // Method to create a new contractor
  createContractor(data) {
    // First add to local data structure for immediate feedback
    const newContractor = {
      id: Date.now(), // Temporary ID until server responds
      ...data,
      employees: [],
    };

    // Prepare data for API
    const apiData = {
      company_name: data.companyName,
      business_type: data.businessType,
      location: data.location || "",
      email: data.email || "",
      phone: data.phone || "",
      rating: parseInt(data.rating) || 0,
      contact_person: {
        name: data.contactPerson.name || "",
        position: data.contactPerson.position || "",
        phone: data.contactPerson.phone || "",
        email: data.contactPerson.email || "",
        is_primary_contact: 1,
      },
    };

    // Исправленный URL API - напрямую к contractors.php вместо index.php
    fetch(
      "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((responseData) => {
        if (responseData.success) {
          // Refresh the contractors list
          this.loadContractors().then(() => this.renderContractors());
        } else {
          console.error("Error creating contractor:", responseData.message);
          alert("Failed to create contractor: " + responseData.message);
        }
      })
      .catch((error) => {
        console.error("Error creating contractor:", error);
        alert("Failed to create contractor. Please try again.");
      });

    // Add to local array for immediate UI update
    this.contractors.push(newContractor);
    this.renderContractors();
  }

  // Method to update an existing contractor
  updateContractor(contractorId, data) {
    // Find the contractor in the local array
    const index = this.contractors.findIndex((c) => c.id === contractorId);
    if (index === -1) return;

    // Update local data first for immediate feedback
    const updatedContractor = {
      ...this.contractors[index],
      ...data,
    };
    this.contractors[index] = updatedContractor;

    // Prepare data for API
    const apiData = {
      company_name: data.companyName,
      business_type: data.businessType,
      location: data.location || "",
      email: data.email || "",
      phone: data.phone || "",
      rating: parseInt(data.rating) || 0,
      contact_person: {
        name: data.contactPerson.name || "",
        position: data.contactPerson.position || "",
        phone: data.contactPerson.phone || "",
        email: data.contactPerson.email || "",
        is_primary_contact: 1,
      },
    };

    // Исправленный URL API - напрямую к contractors.php вместо index.php
    fetch(
      `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((responseData) => {
        if (responseData.success) {
          // Refresh the contractors list
          this.loadContractors().then(() => this.renderContractors());
        } else {
          console.error("Error updating contractor:", responseData.message);
          alert("Failed to update contractor: " + responseData.message);
        }
      })
      .catch((error) => {
        console.error("Error updating contractor:", error);
        alert("Failed to update contractor. Please try again.");
      });

    // Update the UI immediately for better UX
    this.renderContractors();
  }

  // Method to delete a contractor
  deleteContractor(contractorId) {
    if (!confirm("Are you sure you want to delete this contractor?")) return;

    // Remove from local array first for immediate feedback
    this.contractors = this.contractors.filter((c) => c.id !== contractorId);

    // Исправленный URL API - напрямую к contractors.php вместо index.php
    fetch(
      `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?id=${contractorId}`,
      {
        method: "DELETE",
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((responseData) => {
        if (responseData.success) {
          // Already removed from local array, just re-render
          this.renderContractors();
        } else {
          console.error("Error deleting contractor:", responseData.message);
          alert("Failed to delete contractor: " + responseData.message);

          // Reload contractors to restore the deleted one
          this.loadContractors().then(() => this.renderContractors());
        }
      })
      .catch((error) => {
        console.error("Error deleting contractor:", error);
        alert("Failed to delete contractor. Please try again.");

        // Reload contractors to restore the deleted one
        this.loadContractors().then(() => this.renderContractors());
      });

    // Render immediately for UI feedback
    this.renderContractors();
  }

  // Метод для заполнения списка подрядчиков в выпадающем списке
  populateContractorSelect(select) {
    // Очищаем текущий список
    select.innerHTML = '<option value="">Select Contractor</option>';

    // Заполняем список подрядчиками
    this.contractors.forEach((contractor) => {
      const option = document.createElement("option");
      option.value = contractor.id;
      option.textContent = `${contractor.companyName} (${contractor.businessType})`;
      select.appendChild(option);
    });
  }

  // Метод для обновления списка контактных лиц при выборе подрядчика
  updateContactPersonSelect(contractorId) {
    // Находим активную форму (в модальном окне)
    const activeModal = this.container.querySelector(".modal.active");
    if (!activeModal) return;

    const form = activeModal.querySelector("form");
    if (!form) return;

    const contactPersonSelect = form.elements.contactPersonId;
    if (!contactPersonSelect) return;

    // Очищаем список и делаем его неактивным, если не выбран подрядчик
    contactPersonSelect.innerHTML =
      '<option value="">Select Contact Person</option>';

    if (!contractorId) {
      contactPersonSelect.disabled = true;
      return;
    }

    // Находим выбранного подрядчика
    const contractor = this.contractors.find((c) => c.id == contractorId);
    if (!contractor) {
      contactPersonSelect.disabled = true;
      return;
    }

    // Делаем список активным
    contactPersonSelect.disabled = false;

    // Добавляем основное контактное лицо подрядчика
    if (contractor.contactPerson) {
      const option = document.createElement("option");
      option.value = contractor.contactPerson.id; // Use the contact person's ID instead of contractor ID
      option.textContent = `${contractor.contactPerson.name} (${
        contractor.contactPerson.position || "Primary Contact"
      })`;
      contactPersonSelect.appendChild(option);
    }

    // Добавляем сотрудников подрядчика
    if (contractor.employees && contractor.employees.length > 0) {
      contractor.employees.forEach((employee) => {
        const option = document.createElement("option");
        option.value = employee.id;
        option.textContent = `${employee.name || employee.fullName} (${
          employee.position || "Employee"
        })`;
        contactPersonSelect.appendChild(option);
      });
    }
  }

  // Метод для отображения модального окна проекта
  showProjectModal(type, project = null) {
    // Определяем, какое модальное окно нужно показать
    const modal = this.container.querySelector(
      `#${type === "current" ? "current" : "future"}-project-modal`
    );
    const form = modal.querySelector("form");
    const titleElement = modal.querySelector("h3");

    // Сначала очищаем форму от предыдущих данных
    form.reset();

    // Удаляем все существующие info-message и migrated-fields элементы
    const existingInfoMessages = form.querySelectorAll(".info-message");
    existingInfoMessages.forEach((msg) => msg.remove());

    const existingMigratedFields = form.querySelectorAll(".migrated-fields");
    existingMigratedFields.forEach((field) => field.remove());

    // Обновляем заголовок модального окна в зависимости от действия
    if (titleElement) {
      titleElement.textContent = project
        ? `Edit ${type === "current" ? "Current" : "Future"} Project`
        : `Add ${type === "current" ? "Current" : "Future"} Project`;
    }

    // Указываем тип проекта
    form.elements.projectType.value = type;
    // Set the data attribute for the project type (this was missing)
    form.dataset.projectType = type;

    // Заполняем список подрядчиков
    this.populateContractorSelect(form.elements.contractorId);

    // Добавляем обработчик выбора типа бизнеса для обновления списка подрядчиков
    const businessTypeSelect = form.elements.businessType;
    businessTypeSelect.onchange = () => {
      this.updateContractorSelectByBusinessType(
        businessTypeSelect.value,
        form.elements.contractorId
      );
    };

    // Добавляем обработчик выбора подрядчика для обновления списка контактных лиц
    const contractorSelect = form.elements.contractorId;
    contractorSelect.onchange = () => {
      this.updateContactPersonSelect(contractorSelect.value);
    };

    // Если редактируем существующий проект
    if (project) {
      // Устанавливаем id проекта для формы
      form.dataset.projectId = project.id;

      // Заполняем форму данными проекта, общие для обоих типов
      form.elements.projectName.value = project.name || "";
      form.elements.location.value = project.location || "";
      form.elements.startDate.value = this.formatDateForDisplay(
        project.startDate
      );
      form.elements.endDate.value = this.formatDateForDisplay(project.endDate);

      // Если у проекта уже есть businessType, устанавливаем его
      if (project.businessType) {
        form.elements.businessType.value = project.businessType;
      }

      // Устанавливаем значение подрядчика
      if (project.contractorId) {
        form.elements.contractorId.value = project.contractorId;
        // После установки значения подрядчика, обновляем список контактных лиц
        this.updateContactPersonSelect(project.contractorId);
      }

      if (project.contactPersonId) {
        form.elements.contactPersonId.value = project.contactPersonId;
      }

      // Обрабатываем специфичные для типа проекта поля
      if (type === "current") {
        form.elements.progress.value = project.progress || 0;
        form.elements.actualCost.value = project.actualCost || "";
        form.elements.status.value = project.status || "not_started";
        if (form.elements.lastUpdate) {
          form.elements.lastUpdate.value = this.formatDateForDisplay(
            project.lastUpdate
          );
        }
      } else {
        // Future project
        form.elements.budget.value = project.budget || "";
        form.elements.priority.value = project.priority || "medium";
        form.elements.description.value = project.description || "";
        form.elements.objectives.value = project.objectives || "";
        form.elements.risks.value = project.risks || "";
      }

      // Отображаем существующие файлы проекта, если есть метод
      if (typeof this.displayExistingFiles === "function") {
        this.displayExistingFiles(project, type);
      }
    } else {
      // Для нового проекта
      form.dataset.projectId = "";

      // Обновляем список контактных лиц на пустой
      const contactPersonSelect = form.elements.contactPersonId;
      contactPersonSelect.innerHTML =
        '<option value="">Select Contact Person</option>';
      contactPersonSelect.disabled = true;
    }

    // Показываем модальное окно
    modal.classList.add("active");

    // Инициализируем календари для полей дат после открытия модального окна
    setTimeout(() => {
      this.initDatepickers();
    }, 100);
  }

  // Метод для фильтрации списка подрядчиков по виду деятельности
  updateContractorSelectByBusinessType(businessType, select) {
    // Очищаем текущий список
    select.innerHTML = '<option value="">Select Contractor</option>';

    // Если не выбран тип бизнеса, показываем всех подрядчиков
    if (!businessType || businessType === "") {
      this.populateContractorSelect(select);
      return;
    }

    // Фильтруем подрядчиков по выбранному типу бизнеса
    const filteredContractors = this.contractors.filter(
      (contractor) => contractor.businessType === businessType
    );

    // Если нет подрядчиков с таким типом бизнеса, показываем сообщение
    if (filteredContractors.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No contractors with this business type";
      select.appendChild(option);
      return;
    }

    // Заполняем список отфильтрованными подрядчиками
    filteredContractors.forEach((contractor) => {
      const option = document.createElement("option");
      option.value = contractor.id;
      option.textContent = `${contractor.companyName} (${contractor.businessType})`;
      select.appendChild(option);
    });
  }

  // Метод обработки отправки формы проекта
  handleProjectSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const projectType = form.dataset.projectType; // Store this in a local constant
    const isEdit = form.dataset.projectId ? true : false;

    // Format dates in YYYY-MM-DD format
    const startDate = form.elements.startDate.value
      ? this.formatDateForAPI(form.elements.startDate.value)
      : null;
    const endDate = form.elements.endDate.value
      ? this.formatDateForAPI(form.elements.endDate.value)
      : null;

    // Handle contact person ID - set to null if empty or invalid
    let contactPersonId = form.elements.contactPersonId.value
      ? parseInt(form.elements.contactPersonId.value)
      : null;

    // If contactPersonId is 0 or NaN, set it to null to avoid foreign key constraints
    if (contactPersonId === 0 || isNaN(contactPersonId)) {
      contactPersonId = null;
    }

    // Gather form data
    const projectData = {
      name: form.elements.projectName.value,
      location: form.elements.location.value,
      start_date: startDate,
      end_date: endDate,
      business_type: form.elements.businessType.value,
      contractor_id: parseInt(form.elements.contractorId.value) || null,
      contact_person_id: contactPersonId,
      project_type: projectType,
    };

    // Add type-specific fields
    if (projectType === "current") {
      projectData.progress = parseInt(form.elements.progress.value) || 0;
      projectData.actual_cost = parseFloat(form.elements.actualCost.value) || 0;
      projectData.status = form.elements.status.value || "planned";
      if (form.elements.lastUpdate) {
        projectData.last_update = form.elements.lastUpdate.value
          ? this.formatDateForAPI(form.elements.lastUpdate.value)
          : new Date().toISOString().split("T")[0];
      }
    } else {
      // Future project
      projectData.budget = parseFloat(form.elements.budget.value) || 0;
      projectData.priority = form.elements.priority.value || "medium";
      projectData.description = form.elements.description.value || "";
      projectData.objectives = form.elements.objectives.value || "";
      projectData.risks = form.elements.risks.value || "";
      projectData.status = "planned";
    }

    // Create a temporary local copy for immediate UI update
    const localProject = {
      ...projectData,
      id: isEdit ? parseInt(form.dataset.projectId) : Date.now(),
      startDate: form.elements.startDate.value, // Keep original format for UI
      endDate: form.elements.endDate.value, // Keep original format for UI
      businessType: projectData.business_type,
      contractorId: projectData.contractor_id,
      contactPersonId: projectData.contact_person_id,
      actualCost: projectData.actual_cost,
      lastUpdate: form.elements.lastUpdate
        ? form.elements.lastUpdate.value
        : null,
    };

    // Collect file data
    const files = [];

    // Process files based on project type
    if (projectType === "current") {
      // Process photos
      const photosInput = form.elements.photos;
      if (photosInput && photosInput.files.length > 0) {
        Array.from(photosInput.files).forEach((file) => {
          files.push({
            file: file,
            category: "photo",
          });
        });
      }

      // Process documents
      const documentsInput = form.elements.documents;
      if (documentsInput && documentsInput.files.length > 0) {
        Array.from(documentsInput.files).forEach((file) => {
          files.push({
            file: file,
            category: "document",
          });
        });
      }

      // Process reports
      const reportsInput = form.elements.reports;
      if (reportsInput && reportsInput.files.length > 0) {
        Array.from(reportsInput.files).forEach((file) => {
          files.push({
            file: file,
            category: "report",
          });
        });
      }
    } else {
      // Process future project documents
      const documentsInput = form.elements.documents;
      if (documentsInput && documentsInput.files.length > 0) {
        Array.from(documentsInput.files).forEach((file) => {
          files.push({
            file: file,
            category: "document",
          });
        });
      }

      // Process specifications
      const specificationsInput = form.elements.specifications;
      if (specificationsInput && specificationsInput.files.length > 0) {
        Array.from(specificationsInput.files).forEach((file) => {
          files.push({
            file: file,
            category: "specification",
          });
        });
      }
    }

    const apiUrl =
      "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php";

    if (isEdit) {
      // Update existing project
      const projectId = parseInt(form.dataset.projectId);
      console.log(`Updating ${projectType} project ID: ${projectId}`);

      // First upload files
      this.uploadProjectFiles(projectId, files)
        .then((uploadedFiles) => {
          // Then update project data
          projectData.uploaded_files = uploadedFiles;

          return fetch(`${apiUrl}?action=update&id=${projectId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(projectData),
          });
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((responseData) => {
          if (responseData.success) {
            console.log("Project updated successfully:", responseData);

            // Find project index in the appropriate array
            const projectsArray =
              projectType === "current"
                ? this.currentProjects
                : this.futureProjects;

            const index = projectsArray.findIndex((p) => p.id === projectId);

            if (index !== -1) {
              // Get current project data
              const currentProject = projectsArray[index];

              // Add new uploaded files to files array
              if (!currentProject.files) {
                currentProject.files = [];
              }

              // Append the newly uploaded files to the project
              if (
                projectData.uploaded_files &&
                Array.isArray(projectData.uploaded_files)
              ) {
                currentProject.files = [
                  ...currentProject.files,
                  ...projectData.uploaded_files,
                ];

                // Log the files for debugging
                console.log(
                  `Updated project ${projectId} files:`,
                  currentProject.files
                );
              }

              // Update project in array with new data and uploaded files
              projectsArray[index] = {
                ...currentProject,
                ...localProject,
              };
            }

            alert("Project updated successfully!");

            // Close modal
            this.closeModals();

            // Update project list - use the stored projectType value to avoid undefined
            this.renderProjects(projectType);

            // Also update statistics
            this.updateProjectStatistics(projectType);
          } else {
            console.error("Error updating project:", responseData.message);
            alert("Error updating project: " + responseData.message);
          }
        })
        .catch((error) => {
          console.error("Error updating project:", error);
          alert("Error updating project. Please try again.");
        });
    } else {
      // Create new project
      console.log(`Creating new ${projectType} project`);

      // First create the project to get the project ID
      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((responseData) => {
          if (responseData.success) {
            console.log("Project created successfully:", responseData);

            // Update project ID from server
            const projectId =
              responseData.data && responseData.data.id
                ? responseData.data.id
                : null;

            if (projectId) {
              localProject.id = projectId;

              // Then upload files
              return this.uploadProjectFiles(projectId, files).then(
                (uploadedFiles) => {
                  // Add explicit return with the project ID and type
                  return {
                    projectId,
                    uploadedFiles,
                    type: projectType, // Add type to carry it forward
                  };
                }
              );
            } else {
              throw new Error("No project ID received from server");
            }
          } else {
            console.error("Error creating project:", responseData.message);
            alert("Error creating project: " + responseData.message);
            throw new Error(responseData.message);
          }
        })
        .then((result) => {
          console.log("Files uploaded successfully:", result.uploadedFiles);

          // Add uploaded files to local project object
          localProject.files = result.uploadedFiles || [];

          // Add project to appropriate array
          if (result.type === "current") {
            this.currentProjects.push(localProject);
          } else {
            this.futureProjects.push(localProject);
          }

          alert("New project created successfully!");

          // Close modal
          this.closeModals();

          // Update project list - use the type from the result object
          this.renderProjects(result.type);

          // Also update statistics
          this.updateProjectStatistics(result.type);
        })
        .catch((error) => {
          console.error("Error creating project:", error);
          alert("Error creating project. Please try again.");
        });
    }
  }

  updateProjectStatus(projectId, newStatus, type) {
    const project = this.getProjectById(parseInt(projectId), type);
    if (!project) return;

    // When moving a project from Future to Current
    if (type === "future" && newStatus === "move-to-current") {
      // Создаем копию исходного проекта для последующей синхронизации файлов
      const originalProject = JSON.parse(JSON.stringify(project));

      // Сохраняем копию проекта, а не ссылку на объект
      let projectCopy = JSON.parse(JSON.stringify(project));

      // Удаляем проект из Future Projects
      this.futureProjects = this.futureProjects.filter(
        (p) => p.id !== projectId
      );

      // Устанавливаем начальный статус для текущего проекта
      projectCopy.status = "in-progress";

      // Копируем значение Budget из будущего проекта в Actual Cost текущего проекта
      if (projectCopy.budget) {
        console.log(
          `Moving project: Budget value ${projectCopy.budget} transferred to Actual Cost`
        );
        projectCopy.actualCost = projectCopy.budget;
        projectCopy.actual_cost = projectCopy.budget;
      } else {
        console.log(`Moving project: No budget value found to transfer`);
        projectCopy.actualCost = 0;
        projectCopy.actual_cost = 0;
      }

      // Устанавливаем начальный прогресс
      if (!projectCopy.progress) {
        projectCopy.progress = 0;
      }

      // Создаем новые поля, необходимые для Current Projects, если они отсутствуют
      projectCopy.lastUpdate = new Date().toISOString().split("T")[0];
      projectCopy.last_update = projectCopy.lastUpdate;
      if (!projectCopy.photos) projectCopy.photos = [];
      if (!projectCopy.documents) projectCopy.documents = []; // Сохраняем существующие документы
      if (!projectCopy.reports) projectCopy.reports = [];

      // Mark that this project was migrated from Future Projects
      projectCopy.migratedFromFuture = true;
      projectCopy.migrated_from_future = 1;

      // Mark documents as migrated
      if (projectCopy.documents && projectCopy.documents.length > 0) {
        projectCopy.documents = projectCopy.documents.map((doc) => {
          return { ...doc, migratedFromFuture: true };
        });
      }

      // Отмечаем спецификации как мигрированные
      if (projectCopy.specifications && projectCopy.specifications.length > 0) {
        projectCopy.specifications = projectCopy.specifications.map((spec) => {
          return { ...spec, migratedFromFuture: true };
        });
      }

      // Отмечаем бюджетные документы как мигрированные
      if (projectCopy.budgetDocs && projectCopy.budgetDocs.length > 0) {
        projectCopy.budgetDocs = projectCopy.budgetDocs.map((doc) => {
          return { ...doc, migratedFromFuture: true };
        });
      }

      // Синхронизируем удаленные файлы
      projectCopy = this.syncDeletedFiles(originalProject, projectCopy);

      // Преобразуем даты в формат YYYY-MM-DD перед отправкой на сервер
      const start_date = this.formatDateForAPI(projectCopy.startDate);
      const end_date = this.formatDateForAPI(projectCopy.endDate);

      // Ensure contact_person_id is valid
      let contactPersonId = projectCopy.contactPersonId;
      if (
        contactPersonId === 0 ||
        isNaN(contactPersonId) ||
        contactPersonId === undefined
      ) {
        contactPersonId = null;
      }

      // Подготавливаем данные для API
      const apiData = {
        name: projectCopy.name,
        location: projectCopy.location,
        start_date: start_date,
        end_date: end_date,
        business_type: projectCopy.businessType,
        contractor_id: projectCopy.contractorId || null,
        contact_person_id: contactPersonId,
        project_type: "current",
        status: projectCopy.status,
        progress: projectCopy.progress,
        actual_cost: projectCopy.actualCost,
        last_update: projectCopy.lastUpdate,
        migrated_from_future: 1,
        files: projectCopy.files || [],
      };

      // Отправляем запрос на создание нового проекта типа "current"
      fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            console.log("Project moved to current successfully");

            // Обновляем ID если вернулся от сервера
            if (data.data && data.data.id) {
              projectCopy.id = data.data.id;
            }

            // Добавляем проект в Current Projects
            this.currentProjects.push(projectCopy);

            // Update both sections' stats when moving a project between sections
            this.renderProjects("future");
            this.renderProjects("current");
            this.updateProjectStatistics("future");
            this.updateProjectStatistics("current");
          } else {
            console.error("Error moving project to current:", data.message);
            alert(`Ошибка при перемещении проекта: ${data.message}`);
          }
        })
        .catch((error) => {
          console.error("Error moving project to current:", error);
          alert(
            "Ошибка при перемещении проекта. Пожалуйста, попробуйте снова."
          );
        });

      // Отправляем запрос на удаление проекта из future
      fetch(
        `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?id=${projectId}`,
        {
          method: "DELETE",
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            console.log("Original future project deleted successfully");
          } else {
            console.error(
              "Error deleting original future project:",
              data.message
            );
          }
        })
        .catch((error) => {
          console.error("Error deleting original future project:", error);
        });
    } else {
      // Обновляем статус в текущем разделе
      project.status = newStatus;

      // Обновляем классы статуса для элемента select
      const statusSelect = this.container.querySelector(
        `.status-select[data-project-id="${projectId}"]`
      );
      if (statusSelect) {
        statusSelect.value = newStatus;
        this.updateStatusClasses(statusSelect, newStatus);
      }

      // Подготавливаем данные для API
      const apiData = {
        status: newStatus,
        last_update: new Date().toISOString().split("T")[0],
      };

      // Отправляем запрос на обновление статуса проекта
      fetch(
        `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?action=update&id=${projectId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.success) {
            console.log("Project status updated successfully");
            // Обновляем UI
            this.renderProjects(type);
            this.updateProjectStatistics(type);
          } else {
            console.error("Error updating project status:", data.message);
            alert(`Ошибка при обновлении статуса проекта: ${data.message}`);
          }
        })
        .catch((error) => {
          console.error("Error updating project status:", error);
          alert(
            "Ошибка при обновлении статуса проекта. Пожалуйста, попробуйте снова."
          );
        });
    }
  }

  initFileUploadSection(inputId, fileType) {
    const input = this.container.querySelector(`#${inputId}`);
    const previewContainer = this.container.querySelector(
      `#${inputId}-preview`
    );
    const progressContainer = input
      .closest(".form-group")
      .querySelector(".upload-progress");
    const progressBar = progressContainer.querySelector(".progress-bar-fill");
    const progressText = progressContainer.querySelector(".progress-text");

    if (!input || !previewContainer) return;

    // Обработчик изменения input
    input.addEventListener("change", (e) => {
      this.handleFileSelection(
        e.target.files,
        fileType,
        previewContainer,
        progressContainer,
        progressBar,
        progressText
      );
    });

    // Обработчики drag-and-drop
    const dropZone = input.closest(".file-upload-container");
    if (dropZone) {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });

      ["dragenter", "dragover"].forEach((eventName) => {
        dropZone.addEventListener(eventName, () => {
          dropZone.classList.add("drag-over");
        });
      });

      ["dragleave", "drop"].forEach((eventName) => {
        dropZone.addEventListener(eventName, () => {
          dropZone.classList.remove("drag-over");
        });
      });

      dropZone.addEventListener("drop", (e) => {
        const files = e.dataTransfer.files;
        this.handleFileSelection(
          files,
          fileType,
          previewContainer,
          progressContainer,
          progressBar,
          progressText
        );
      });
    }
  }

  handleFileSelection(
    files,
    fileType,
    previewContainer,
    progressContainer,
    progressBar,
    progressText
  ) {
    if (!files || files.length === 0) return;

    // Show progress bar
    progressContainer.classList.add("active");

    // Create array for previews
    const previews = [];

    // Process each file
    Array.from(files).forEach((file, index) => {
      // Create preview object
      const preview = {
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
        category: fileType,
      };

      // Add to previews array
      previews.push(preview);

      // If it's an image, create preview
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.data = e.target.result;
          this.updateFilePreviews(previewContainer, previews);
          this.updateProgress(
            progressBar,
            progressText,
            index + 1,
            files.length
          );
        };
        reader.readAsDataURL(file);
      } else {
        // For non-images, just update preview
        this.updateFilePreviews(previewContainer, previews);
        this.updateProgress(progressBar, progressText, index + 1, files.length);
      }
    });
  }

  updateFilePreviews(container, previews) {
    if (!container || !Array.isArray(previews)) return;

    // Clear existing previews
    container.innerHTML = "";

    // Add new previews
    previews.forEach((preview) => {
      const previewItem = document.createElement("div");
      previewItem.className = "file-preview-item";
      previewItem.dataset.fileType = preview.category;
      previewItem.dataset.fileName = preview.name;
      previewItem.dataset.mimeType = preview.type;

      // Create preview content based on file type
      if (preview.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = preview.data || URL.createObjectURL(preview.file);
        img.alt = preview.name;
        previewItem.appendChild(img);
      } else {
        const icon = document.createElement("i");
        icon.className = this.getFileIconClass(preview.type);
        previewItem.appendChild(icon);
      }

      // Add file info
      const info = document.createElement("div");
      info.className = "file-info";
      info.innerHTML = `
            <span class="file-name">${preview.name}</span>
            <span class="file-size">${this.formatFileSize(preview.size)}</span>
        `;
      previewItem.appendChild(info);

      // Add remove button
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-file";
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      previewItem.appendChild(removeBtn);

      container.appendChild(previewItem);
    });

    // Bind events to new preview items
    this.bindFilePreviewEvents(container);
  }

  getFileIconClass(mimeType) {
    if (mimeType.startsWith("image/")) return "fas fa-image";
    if (mimeType === "application/pdf") return "fas fa-file-pdf";
    if (mimeType.includes("word")) return "fas fa-file-word";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "fas fa-file-excel";
    return "fas fa-file";
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  updateProgress(progressBar, progressText, current, total) {
    const percentage = (current / total) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `Uploading: ${Math.round(percentage)}%`;

    if (current === total) {
      setTimeout(() => {
        progressBar.style.width = "0%";
        progressText.textContent = "Uploading: 0%";
      }, 1000);
    }
  }

  onSectionChange(sectionId) {
    // Если секция не указана, используем активную
    if (!sectionId) {
      const activeSection = this.container.querySelector(
        ".construction-section.active"
      );
      if (activeSection) {
        sectionId = activeSection.id;
      } else {
        return;
      }
    }

    // Вызываем специфические действия для каждой секции
    if (sectionId === "contractors-section") {
      this.renderContractors();
    } else if (sectionId === "current-projects-section") {
      this.renderProjects("current");
    } else if (sectionId === "future-projects-section") {
      this.renderProjects("future");
    }

    // Update statistics for the active section
    if (sectionId === "current-projects-section") {
      this.updateProjectStatistics("current");
    } else if (sectionId === "future-projects-section") {
      this.updateProjectStatistics("future");
    }
  }

  async loadData() {
    try {
      // Here will be API calls to load data
      // For now using mock data
      await this.loadContractors();
      this.updateBusinessTypeFilter(); // Обновляем список типов бизнеса после загрузки
      await this.loadCurrentProjects();
      await this.loadFutureProjects();
      this.renderActiveSection();

      // Update statistics for both sections after loading data
      this.updateProjectStatistics("current");
      this.updateProjectStatistics("future");
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  switchTab(tab) {
    this.container
      .querySelectorAll(".construction-section")
      .forEach((s) => s.classList.remove("active"));

    // Update section title
    const sectionTitle = this.container.querySelector("#section-title");
    if (sectionTitle) {
      sectionTitle.textContent =
        tab === "contractors"
          ? "Contractors"
          : tab === "current-projects"
          ? "Current Projects"
          : "Future Projects";
    }

    // Show appropriate section
    this.container.querySelector(`#${tab}-section`).classList.add("active");

    // Update filters visibility
    const contractorsFilters = this.container.querySelector(
      "#contractors-filters"
    );
    const currentProjectsFilters = this.container.querySelector(
      "#current-projects-filters"
    );
    const futureProjectsFilters = this.container.querySelector(
      "#future-projects-filters"
    );

    if (contractorsFilters) {
      contractorsFilters.style.display =
        tab === "contractors" ? "flex" : "none";
    }
    if (currentProjectsFilters) {
      currentProjectsFilters.style.display =
        tab === "current-projects" ? "flex" : "none";
    }
    if (futureProjectsFilters) {
      futureProjectsFilters.style.display =
        tab === "future-projects" ? "flex" : "none";
    }

    // Update add buttons visibility
    const addContractorBtn = this.container.querySelector("#add-contractor");
    const addCurrentProjectBtn = this.container.querySelector(
      "#add-current-project"
    );
    const addFutureProjectBtn = this.container.querySelector(
      "#add-future-project"
    );

    if (addContractorBtn) {
      addContractorBtn.style.display = tab === "contractors" ? "block" : "none";
    }
    if (addCurrentProjectBtn) {
      addCurrentProjectBtn.style.display =
        tab === "current-projects" ? "block" : "none";
    }
    if (addFutureProjectBtn) {
      addFutureProjectBtn.style.display =
        tab === "future-projects" ? "block" : "none";
    }

    this.activeTab = tab;
    this.renderActiveSection();

    // Update project statistics when switching to project tabs
    if (tab === "current-projects") {
      this.updateProjectStatistics("current");
    } else if (tab === "future-projects") {
      this.updateProjectStatistics("future");
    }
  }

  renderActiveSection() {
    switch (this.activeTab) {
      case "contractors":
        this.renderContractors();
        break;
      case "current-projects":
        this.renderProjects("current");
        break;
      case "future-projects":
        this.renderProjects("future");
        break;
    }
  }

  // Методы для работы с подрядчиками
  async loadContractors() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Convert API format to client format
        this.contractors = result.data.map((contractor) => {
          return {
            id: parseInt(contractor.id),
            companyName: contractor.company_name,
            businessType: contractor.business_type,
            location: contractor.location || "",
            email: contractor.email || "",
            phone: contractor.phone || "",
            rating: parseInt(contractor.rating) || 0,
            contactPerson: contractor.contact_person
              ? {
                  id: parseInt(contractor.contact_person.id),
                  name: contractor.contact_person.name,
                  position: contractor.contact_person.position || "",
                  phone: contractor.contact_person.phone || "",
                  email: contractor.contact_person.email || "",
                }
              : {
                  name: "None",
                  position: "",
                  phone: "",
                  email: "",
                },
            employees: contractor.employees
              ? contractor.employees.map((emp) => ({
                  id: parseInt(emp.id),
                  fullName: emp.name,
                  position: emp.position || "",
                  phone: emp.phone || "",
                  email: emp.email || "",
                }))
              : [],
          };
        });
      } else {
        console.error("Failed to load contractors:", result.message);
        // Fallback to empty array
        this.contractors = [];
      }
    } catch (error) {
      console.error("Error loading contractors:", error);
      // Fallback to empty array on error
      this.contractors = [];
    }
  }

  renderContractors() {
    const container = this.container.querySelector("#contractors-list");
    if (!container) return;

    if (this.contractors.length === 0) {
      container.innerHTML = `
            <div class="no-contractors">
                <i class="fas fa-building"></i>
                <h3>No Contractors Yet</h3>
                <p>Click the "Add Contractor" button to add your first contractor</p>
            </div>
        `;
      return;
    }

    container.innerHTML = this.contractors
      .map(
        (contractor) => `
      <div class="contractor-card" data-id="${contractor.id}">
        <div class="contractor-header">
          <h3>${contractor.companyName}</h3>
          <div class="contractor-rating">
            ${this.generateRatingStars(contractor.rating)}
          </div>
        </div>
        <div class="contractor-info">
          <div class="info-item">
            <i class="fas fa-briefcase"></i>
            <span>${contractor.businessType}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-location-dot"></i>
            <span>${contractor.location}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.email}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.phone}</span>
          </div>
        </div>
        <div class="contact-person-info">
          <h4>Contact Person</h4>
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span>${contractor.contactPerson.name}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-id-badge"></i>
            <span>${contractor.contactPerson.position}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.contactPerson.phone}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.contactPerson.email}</span>
          </div>
        </div>
        <div class="contractor-employees">
          <h4>Employees (${contractor.employees.length})</h4>
          <div class="employees-list">
            ${this.renderEmployeesList(contractor.employees)}
          </div>
          <button class="btn-secondary add-employee" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-user-plus"></i> Add Employee
          </button>
        </div>
        <div class="contractor-actions">
          <button class="btn-action edit" data-contractor-id="${contractor.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action delete" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    // Добавляем обработчики событий после рендеринга
    this.bindEmployeeEvents();

    // Add event handlers for contractor edit and delete buttons
    this.container
      .querySelectorAll(".contractor-actions .btn-action.edit")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          const contractor = this.contractors.find(
            (c) => c.id === contractorId
          );
          if (contractor) {
            this.showContractorModal(contractor);
          }
        });
      });

    this.container
      .querySelectorAll(".contractor-actions .btn-action.delete")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          this.deleteContractor(contractorId);
        });
      });
  }

  renderEmployeesList(employees) {
    return employees
      .map(
        (employee) => `
        <div class="employee-item">
            <div class="employee-info">
                <strong>${employee.fullName}</strong>
                <span>${employee.position}</span>
                <span>${employee.phone}</span>
            </div>
            <div class="employee-actions">
                <button class="btn-action edit" data-employee-id="${employee.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" data-employee-id="${employee.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `
      )
      .join("");
  }

  bindEmployeeEvents() {
    // Обработчики для кнопок редактирования сотрудников
    this.container
      .querySelectorAll(".employee-actions .btn-action.edit")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const employeeId = parseInt(button.dataset.employeeId);
          const contractorId = parseInt(
            button.closest(".contractor-card").dataset.id
          );
          this.editEmployee(contractorId, employeeId);
        });
      });

    // Обработчики для кнопок удаления сотрудников
    this.container
      .querySelectorAll(".employee-actions .btn-action.delete")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const employeeId = parseInt(button.dataset.employeeId);
          const contractorId = parseInt(
            button.closest(".contractor-card").dataset.id
          );
          this.deleteEmployee(contractorId, employeeId);
        });
      });

    // Обработчики для кнопок добавления сотрудников
    this.container.querySelectorAll(".add-employee").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const contractorId = parseInt(button.dataset.contractorId);
        this.showEmployeeModal(contractorId);
      });
    });
  }

  showEmployeeModal(contractorId, employee = null) {
    const modal = this.container.querySelector("#employee-modal");
    const form = modal.querySelector("#employee-form");
    const title = modal.querySelector("#employee-modal-title");

    title.textContent = employee ? "Edit Employee" : "Add Employee";

    form.elements.contractorId.value = contractorId;

    if (employee) {
      form.elements.fullName.value = employee.fullName;
      form.elements.position.value = employee.position;
      form.elements.phone.value = employee.phone;
      form.dataset.employeeId = employee.id;
    } else {
      form.reset();
      form.elements.contractorId.value = contractorId;
      delete form.dataset.employeeId;
    }

    modal.classList.add("active");
  }

  editEmployee(contractorId, employeeId) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      const employee = contractor.employees.find((e) => e.id === employeeId);
      if (employee) {
        this.showEmployeeModal(contractorId, employee);
      }
    }
  }

  deleteEmployee(contractorId, employeeId) {
    if (confirm("Are you sure you want to delete this employee?")) {
      const contractor = this.contractors.find((c) => c.id === contractorId);
      if (contractor) {
        contractor.employees = contractor.employees.filter(
          (e) => e.id !== employeeId
        );
        this.renderContractors();
      }
    }
  }

  handleEmployeeSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const contractorId = parseInt(form.elements.contractorId.value);
    const employeeData = {
      fullName: form.elements.fullName.value,
      position: form.elements.position.value,
      phone: form.elements.phone.value,
    };

    if (form.dataset.employeeId) {
      // Редактирование существующего сотрудника
      const employeeId = parseInt(form.dataset.employeeId);
      this.updateEmployee(contractorId, employeeId, employeeData);
    } else {
      // Добавление нового сотрудника
      this.addEmployeeToContractor(contractorId, employeeData);
    }

    this.closeModals();
  }

  addEmployeeToContractor(contractorId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      // First add to local data structure for immediate feedback
      data.id = Date.now(); // Temporary ID
      contractor.employees.push(data);

      // Prepare data for API
      const existingEmployees = contractor.employees.filter(
        (e) => e.id !== data.id
      );

      const apiData = {
        company_name: contractor.companyName,
        business_type: contractor.businessType,
        location: contractor.location,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        notes: contractor.notes || "",
        employees: [
          ...existingEmployees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: 0,
          })),
          // Add new employee
          {
            name: data.fullName,
            position: data.position || "",
            phone: data.phone || "",
            email: data.email || "",
            is_primary_contact: 0,
          },
        ],
      };

      // Используем правильный URL API
      fetch(
        `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((responseData) => {
          if (responseData.success) {
            // Обновляем данные о сотрудниках из ответа API
            if (responseData.data && responseData.data.employees) {
              // Находим контрактор в массиве this.contractors и обновляем его сотрудников
              const updatedContractor = this.contractors.find(
                (c) => c.id === contractorId
              );
              if (updatedContractor) {
                // Преобразуем сотрудников из формата API в формат UI
                updatedContractor.employees = responseData.data.employees.map(
                  (emp) => ({
                    id: parseInt(emp.id),
                    fullName: emp.name,
                    position: emp.position || "",
                    phone: emp.phone || "",
                    email: emp.email || "",
                  })
                );
              }
            }

            // Перерисовываем UI для отображения обновленных данных
            this.renderContractors();
          } else {
            console.error("Error adding employee:", responseData.message);
            alert("Failed to add employee: " + responseData.message);
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          }
        })
        .catch((error) => {
          console.error("Error adding employee:", error);
          alert("Failed to add employee. Please try again.");
          // Обновляем данные с сервера в случае ошибки
          this.loadContractors().then(() => this.renderContractors());
        });

      // Render immediately for responsive UI
      this.renderContractors();
    }
  }

  updateEmployee(contractorId, employeeId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      const index = contractor.employees.findIndex((e) => e.id === employeeId);
      if (index !== -1) {
        // Update local data first
        contractor.employees[index] = {
          ...contractor.employees[index],
          ...data,
        };

        // Prepare data for API
        const apiData = {
          company_name: contractor.companyName,
          business_type: contractor.businessType,
          location: contractor.location,
          email: contractor.email,
          phone: contractor.phone,
          rating: contractor.rating,
          notes: contractor.notes || "",
          employees: contractor.employees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: e.isPrimaryContact ? 1 : 0,
          })),
        };

        // Используем правильный URL API
        fetch(
          `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiData),
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((responseData) => {
            if (responseData.success) {
              // Обновляем данные о сотрудниках из ответа API
              if (responseData.data && responseData.data.employees) {
                // Находим контрактор в массиве this.contractors и обновляем его сотрудников
                const updatedContractor = this.contractors.find(
                  (c) => c.id === contractorId
                );
                if (updatedContractor) {
                  // Преобразуем сотрудников из формата API в формат UI
                  updatedContractor.employees = responseData.data.employees.map(
                    (emp) => ({
                      id: parseInt(emp.id),
                      fullName: emp.name,
                      position: emp.position || "",
                      phone: emp.phone || "",
                      email: emp.email || "",
                    })
                  );
                }
              }

              // Перерисовываем UI для отображения обновленных данных
              this.renderContractors();
            } else {
              console.error("Error updating employee:", responseData.message);
              alert("Failed to update employee: " + responseData.message);
              // Обновляем данные с сервера в случае ошибки
              this.loadContractors().then(() => this.renderContractors());
            }
          })
          .catch((error) => {
            console.error("Error updating employee:", error);
            alert("Failed to update employee. Please try again.");
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          });

        // Render immediately for UI feedback
        this.renderContractors();
      }
    }
  }

  // Методы для работы с проектами
  async loadCurrentProjects() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?type=current"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Преобразуем свойства для совместимости с существующим кодом
        this.currentProjects = data.data.map((project) => ({
          id: project.id,
          name: project.name,
          location: project.location,
          startDate: project.start_date,
          endDate: project.end_date,
          businessType: project.business_type,
          contractorId: project.contractor_id,
          contractorName: project.contractor_name,
          contactPersonId: project.contact_person_id,
          contactPersonName: project.contact_person_name,
          status: project.status,
          progress: project.progress,
          actualCost: project.actual_cost,
          lastUpdate: project.last_update,
          files: project.files || [],
        }));
      } else {
        console.error("Error loading current projects:", data.message);
        this.currentProjects = [];
      }
    } catch (error) {
      console.error("Error loading current projects:", error);
      this.currentProjects = [];
    }
  }

  async loadFutureProjects() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?type=future"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Преобразуем свойства для совместимости с существующим кодом
        this.futureProjects = data.data.map((project) => ({
          id: project.id,
          name: project.name,
          location: project.location,
          startDate: project.start_date,
          endDate: project.end_date,
          businessType: project.business_type,
          contractorId: project.contractor_id,
          contractorName: project.contractor_name,
          contactPersonId: project.contact_person_id,
          contactPersonName: project.contact_person_name,
          status: project.status,
          budget: project.budget,
          priority: project.priority,
          description: project.description,
          objectives: project.objectives,
          risks: project.risks,
          files: project.files || [],
        }));
      } else {
        console.error("Error loading future projects:", data.message);
        this.futureProjects = [];
      }
    } catch (error) {
      console.error("Error loading future projects:", error);
      this.futureProjects = [];
    }
  }

  // Метод для организации файлов проекта по категориям
  organizeProjectFiles(project) {
    if (!project) return project;
    if (!project.files) {
      project.files = [];
    }

    if (!Array.isArray(project.files)) {
      console.error("Files is not an array:", project.files);
      project.files = [];
    }

    console.log(
      `Organizing files for project ${project.id} Files count: ${project.files.length}`
    );

    // Копируем проект, чтобы не изменять оригинал
    const organizedProject = { ...project };

    // Организуем файлы по категориям
    organizedProject.photos = [];
    organizedProject.documents = [];
    organizedProject.reports = [];
    organizedProject.specifications = [];
    organizedProject.budgetDocs = [];

    project.files.forEach((file) => {
      // Ensure file has all necessary properties
      const processedFile = {
        ...file,
        id: file.id || file.fileId || "",
        fileId: file.id || file.fileId || "",
        fileName:
          file.file_name ||
          file.fileName ||
          file.original_name ||
          "Unknown file",
        original_name:
          file.original_name || file.fileName || file.file_name || "",
        filePath: file.file_path || file.filePath || "",
        file_path: file.file_path || file.filePath || "",
        miniPath: file.mini_path || file.miniPath || "",
        mini_path: file.mini_path || file.miniPath || "",
        mimeType: file.mime_type || file.mimeType || "",
        mime_type: file.mime_type || file.mimeType || "",
        fileCategory:
          file.file_category ||
          file.fileCategory ||
          file.category ||
          "document",
      };

      const category = processedFile.fileCategory.toLowerCase();

      if (category === "photo") {
        organizedProject.photos.push(processedFile);
      } else if (category === "document") {
        organizedProject.documents.push(processedFile);
      } else if (category === "report") {
        organizedProject.reports.push(processedFile);
      } else if (category === "specification") {
        organizedProject.specifications.push(processedFile);
      } else if (category === "budget") {
        organizedProject.budgetDocs.push(processedFile);
      } else {
        // Если категория неизвестна, добавляем в документы
        organizedProject.documents.push(processedFile);
      }
    });

    console.log(`Organized files for project ${project.id}`, {
      photos: organizedProject.photos.length,
      documents: organizedProject.documents.length,
      reports: organizedProject.reports.length,
      specifications: organizedProject.specifications.length,
      budgetDocs: organizedProject.budgetDocs.length,
    });

    return organizedProject;
  }

  // Изменим метод renderProjects, чтобы использовать organizeProjectFiles
  renderProjects(type, projectsToRender = null) {
    const projects =
      projectsToRender ||
      (type === "current" ? this.currentProjects : this.futureProjects);
    const container = this.container.querySelector(`#${type}-projects-list`);

    if (!container) {
      console.error(`Container #${type}-projects-list not found`);
      return;
    }

    console.log(`Rendering ${type} projects:`, projects);
    container.innerHTML = "";

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>No projects found</p>
        </div>
      `;

      // Update statistics even if no projects are found
      this.updateProjectStatistics(type);
      return;
    }

    projects.forEach((project) => {
      // Организуем файлы проекта по категориям
      const organizedProject = this.organizeProjectFiles(project);

      const contractor = this.contractors.find(
        (c) => c.id === organizedProject.contractorId
      );
      const template = this.container.querySelector(
        `#${type}-project-card-template`
      );

      if (!template) {
        console.error(`Template #${type}-project-card-template not found`);
        return;
      }

      const card = template.content.cloneNode(true);

      // Set project ID
      const projectCard = card.querySelector(".project-card");
      projectCard.dataset.id = organizedProject.id;

      // Set project name and status
      card.querySelector(".project-name").textContent = organizedProject.name;
      const statusSelect = card.querySelector(".status-select");
      statusSelect.value = organizedProject.status;

      // Добавляем data-атрибут для привязки к проекту
      statusSelect.setAttribute("data-project-id", organizedProject.id);

      // Обновляем классы статуса
      this.updateStatusClasses(statusSelect, organizedProject.status);

      // Set project details
      card.querySelector(".location").textContent = organizedProject.location;

      // Форматируем даты для отображения
      const startDateFormatted = this.formatDateForDisplay(
        organizedProject.startDate
      );
      const endDateFormatted = this.formatDateForDisplay(
        organizedProject.endDate
      );
      card.querySelector(
        ".dates"
      ).textContent = `${startDateFormatted} - ${endDateFormatted}`;

      if (type === "current") {
        this.renderCurrentProjectDetails(card, organizedProject, contractor);
      } else {
        this.renderFutureProjectDetails(card, organizedProject, contractor);
      }

      // Добавляем карточку в контейнер
      container.appendChild(card);
    });

    // After rendering all projects, update the statistics
    this.updateProjectStatistics(type);

    // Bind events to project cards
    this.bindProjectCardEvents(type);

    // Привязываем события к предпросмотрам файлов
    this.bindFilePreviewEvents();

    // Добавим дополнительную логику для обработки всех изображений на странице
    this.enhanceAllImagePreviews(type);
  }

  // Метод для улучшения всех превью изображений в указанной секции
  enhanceAllImagePreviews(type) {
    // Получаем контейнер для секции
    const sectionId =
      type === "current"
        ? "current-projects-section"
        : "future-projects-section";
    const section = this.container.querySelector(`#${sectionId}`);
    if (!section) return;

    // Находим все изображения в секции
    const images = section.querySelectorAll(".file-preview-container img");
    images.forEach((img) => {
      // Проверяем, что у изображения есть src
      const src = img.getAttribute("src");
      if (src) {
        // Делаем курсор указателем
        img.style.cursor = "pointer";

        // Удаляем старые обработчики, чтобы избежать дублирования
        const newImg = img.cloneNode(true);
        img.parentNode.replaceChild(newImg, img);

        // Добавляем обработчик клика
        newImg.addEventListener("click", () => {
          console.log("Image clicked:", src);
          this.showImageModal(src);
        });
      }
    });

    console.log(`Enhanced ${images.length} images in ${type} projects section`);
  }

  updateStatusClasses(statusSelect, status) {
    // Удаляем все существующие классы статуса
    statusSelect.classList.remove(
      "planned",
      "in-progress",
      "completed",
      "on-hold",
      "move-to-current",
      "delayed",
      "design-phase", // Добавляем новые возможные статусы
      "planning"
    );

    // Преобразуем статус для использования в качестве CSS класса (заменяем пробелы на дефисы)
    const statusClass = status.replace(/\s+/g, "-").toLowerCase();

    // Добавляем новый класс статуса
    statusSelect.classList.add(statusClass);

    // Сбрасываем inline стили, которые могли быть установлены ранее
    statusSelect.style.backgroundColor = "";
    statusSelect.style.color = "";
    statusSelect.style.borderColor = "";

    // Определяем цвета в зависимости от статуса
    let colors = {
      planned: {
        bg: "#e3f2fd",
        color: "#1976d2",
        border: "#90caf9",
      },
      "in-progress": {
        bg: "#fff3e0",
        color: "#f57c00",
        border: "#ffcc80",
      },
      completed: {
        bg: "#e8f5e9",
        color: "#388e3c",
        border: "#a5d6a7",
      },
      "on-hold": {
        bg: "#ffebee",
        color: "#d32f2f",
        border: "#ef9a9a",
      },
      "move-to-current": {
        bg: "#f3e5f5",
        color: "#7b1fa2",
        border: "#ce93d8",
      },
      delayed: {
        bg: "#ffebee",
        color: "#d32f2f",
        border: "#ef9a9a",
      },
      "design-phase": {
        // Добавляем новые статусы с цветами
        bg: "#e0f7fa",
        color: "#0097a7",
        border: "#80deea",
      },
      planning: {
        bg: "#f3e5f5",
        color: "#8e24aa",
        border: "#ce93d8",
      },
    };

    // Пробуем найти цвета для статуса напрямую или для его CSS версии
    let colorConfig = colors[status] || colors[statusClass];

    // Применяем стили, если статус найден в нашем объекте
    if (colorConfig) {
      statusSelect.style.backgroundColor = colorConfig.bg;
      statusSelect.style.color = colorConfig.color;
      statusSelect.style.borderColor = colorConfig.border;
      statusSelect.style.borderWidth = "1px";
      statusSelect.style.borderStyle = "solid";
    } else {
      // Если статус неизвестен, применяем стандартные стили
      statusSelect.style.backgroundColor = "#f5f5f5";
      statusSelect.style.color = "#616161";
      statusSelect.style.borderColor = "#bdbdbd";
      statusSelect.style.borderWidth = "1px";
      statusSelect.style.borderStyle = "solid";
    }

    // Устанавливаем data-атрибут для дополнительной поддержки селекторов
    statusSelect.setAttribute("data-status", status);
  }

  // Helper method to update card size after toggle
  updateCardSize(card) {
    // Ensure card is a DOM element
    if (!card || typeof card.closest !== "function") {
      // If card is not a DOM element, try to find the project card differently
      // This handles cases where 'card' might be the project card body or another element
      const projectCard = card.parentElement
        ? card.parentElement.closest(".project-card")
        : document.querySelector(".project-card");

      if (projectCard) {
        // Set height to auto to let it resize naturally
        projectCard.style.height = "auto";
        const cardBody = projectCard.querySelector(".card-body");
        if (cardBody) {
          cardBody.style.height = "auto";
        }
      }
      return;
    }

    // Regular handling if card is a DOM element with closest method
    const projectCard = card.closest(".project-card");
    if (projectCard) {
      // Ensure card body expands/contracts with content
      const cardBody = projectCard.querySelector(".card-body");
      if (cardBody) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          // Reset any fixed heights
          cardBody.style.height = "";
          projectCard.style.height = "";

          // Calculate and set new height
          const height = cardBody.scrollHeight;
          cardBody.style.height = height + "px";

          // Allow height to adjust naturally after initial animation
          setTimeout(() => {
            cardBody.style.height = "auto";
          }, 300);
        }, 10);
      }
    }
  }

  renderCurrentProjectDetails(card, project, contractor) {
    // Set current project specific details
    card.querySelector(".progress").textContent = project.progress
      ? `${project.progress}%`
      : "Not started";
    card.querySelector(".actual-cost").textContent = project.actualCost
      ? `$${project.actualCost.toLocaleString()}`
      : "Not specified";
    card.querySelector(".contractor").textContent = contractor
      ? contractor.companyName
      : "Not assigned";
    card.querySelector(".project-manager").textContent =
      contractor && contractor.contactPerson
        ? `${contractor.contactPerson.name} (${contractor.contactPerson.position})`
        : "Not assigned";

    // Форматируем дату последнего обновления
    const lastUpdateFormatted = project.lastUpdate
      ? this.formatDateForDisplay(project.lastUpdate)
      : "Not updated";
    card.querySelector(".last-update").textContent = lastUpdateFormatted;

    // Определяем, является ли проект перенесенным из Future в Current
    const isMigratedProject =
      project.description ||
      project.objectives ||
      project.risks ||
      project.priority ||
      (project.specifications && project.specifications.length > 0) ||
      (project.budgetDocs && project.budgetDocs.length > 0) ||
      (project.documents &&
        project.documents.length > 0 &&
        project.migratedFromFuture);

    const detailsSection = card.querySelector(".project-details");

    // Make Project Documents header collapsible
    const documentsSection = detailsSection.querySelector(
      ".details-section:last-child"
    );
    const docHeader = documentsSection.querySelector("h4");

    // Make header collapsible
    docHeader.classList.add("collapsible-header");
    const documentsGrid = documentsSection.querySelector(".documents-grid");
    documentsGrid.classList.add("collapsible-content");

    // Add click event to toggle
    docHeader.addEventListener("click", (e) => {
      e.preventDefault();
      docHeader.classList.toggle("collapsed");
      documentsGrid.classList.toggle("collapsed");

      // Update card size after toggle - pass the project card element
      this.updateCardSize(docHeader.closest(".project-card"));
    });

    // Reorganize documents grid - group migrated files at the top
    if (isMigratedProject) {
      // Clear existing content
      documentsGrid.innerHTML = "";

      // Add a collapsible header for migrated files
      const migratedHeader = document.createElement("div");
      migratedHeader.className = "section-header";
      migratedHeader.innerHTML = `
        <h4 class="toggle-documents">
          <i class="fas fa-chevron-down"></i> 
          <span class="from-future-flag">From Future Project</span>
        </h4>
      `;
      documentsGrid.appendChild(migratedHeader);

      // Create migrated files group
      const migratedFilesGroup = document.createElement("div");
      migratedFilesGroup.className = "migrated-files-group documents-content";
      documentsGrid.appendChild(migratedFilesGroup);

      // Make sure content is fully visible with scrolling if needed
      migratedFilesGroup.style.overflowY = "visible";
      migratedFilesGroup.style.maxHeight = "none";
      documentsGrid.style.overflowY = "visible";

      // Add Planning Documents (formerly called Documents in Future Projects) if they exist
      if (
        project.documents &&
        project.documents.length > 0 &&
        project.migratedFromFuture
      ) {
        const planningDocsGroup = document.createElement("div");
        planningDocsGroup.className = "documents-group migrated-files";
        planningDocsGroup.innerHTML = `
          <h5>Planning Documents</h5>
          <div class="planning-docs-preview file-preview-container">
            ${this.renderFilePreviews(project.documents, "document")}
          </div>
        `;
        migratedFilesGroup.appendChild(planningDocsGroup);
      }

      // Add specifications if they exist
      if (project.specifications && project.specifications.length > 0) {
        const specificationsGroup = document.createElement("div");
        specificationsGroup.className = "documents-group migrated-files";
        specificationsGroup.innerHTML = `
          <h5>Specifications</h5>
          <div class="specifications-preview file-preview-container">
            ${this.renderFilePreviews(project.specifications, "specification")}
          </div>
        `;
        migratedFilesGroup.appendChild(specificationsGroup);
      }

      // Add budget documents if they exist
      if (project.budgetDocs && project.budgetDocs.length > 0) {
        const budgetDocsGroup = document.createElement("div");
        budgetDocsGroup.className = "documents-group migrated-files";
        budgetDocsGroup.innerHTML = `
          <h5>Budget Documents</h5>
          <div class="budget-docs-preview file-preview-container">
            ${this.renderFilePreviews(project.budgetDocs, "budgetDoc")}
          </div>
        `;
        migratedFilesGroup.appendChild(budgetDocsGroup);
      }

      // Add a collapsible header for current files
      const currentHeader = document.createElement("div");
      currentHeader.className = "section-header";
      currentHeader.innerHTML = `
        <h4 class="toggle-documents">
          <i class="fas fa-chevron-down"></i> 
          <span class="current-files-title">Current Project Files</span>
        </h4>
      `;
      documentsGrid.appendChild(currentHeader);

      // Create current files group
      const currentFilesGroup = document.createElement("div");
      currentFilesGroup.className = "current-files-group documents-content";
      documentsGrid.appendChild(currentFilesGroup);

      // Add current files (Photos, Reports)
      // Photos
      if (project.photos && project.photos.length > 0) {
        const photosGroup = document.createElement("div");
        photosGroup.className = "documents-group";
        photosGroup.innerHTML = `
          <h5>Photos</h5>
          <div class="photos-preview file-preview-container">
            ${this.renderFilePreviews(project.photos, "photo")}
          </div>
        `;
        currentFilesGroup.appendChild(photosGroup);
      } else {
        const photosGroup = document.createElement("div");
        photosGroup.className = "documents-group";
        photosGroup.innerHTML = `
          <h5>Photos</h5>
          <div class="photos-preview file-preview-container"></div>
        `;
        currentFilesGroup.appendChild(photosGroup);
      }

      // Reports
      if (project.reports && project.reports.length > 0) {
        const reportsGroup = document.createElement("div");
        reportsGroup.className = "documents-group";
        reportsGroup.innerHTML = `
          <h5>Reports</h5>
          <div class="reports-preview file-preview-container">
            ${this.renderFilePreviews(project.reports, "report")}
          </div>
        `;
        currentFilesGroup.appendChild(reportsGroup);
      } else {
        const reportsGroup = document.createElement("div");
        reportsGroup.className = "documents-group";
        reportsGroup.innerHTML = `
          <h5>Reports</h5>
          <div class="reports-preview file-preview-container"></div>
        `;
        currentFilesGroup.appendChild(reportsGroup);
      }

      // Add toggle functionality for each section individually
      const toggleSections = card.querySelectorAll(".toggle-documents");
      toggleSections.forEach((toggle) => {
        toggle.addEventListener("click", (e) => {
          const content = toggle.closest(".section-header").nextElementSibling;
          content.classList.toggle("collapsed");
          const icon = toggle.querySelector("i");
          icon.classList.toggle("fa-chevron-down");
          icon.classList.toggle("fa-chevron-right");

          // Update card size after toggle
          this.updateCardSize(toggle.closest(".project-card"));
        });
      });
    } else {
      // Just set file previews without reorganization
      if (project.photos && project.photos.length > 0) {
        card.querySelector(".photos-preview").innerHTML =
          this.renderFilePreviews(project.photos, "photo");
      }
      if (project.documents && project.documents.length > 0) {
        card.querySelector(".documents-preview").innerHTML =
          this.renderFilePreviews(project.documents, "document");
      }
      if (project.reports && project.reports.length > 0) {
        card.querySelector(".reports-preview").innerHTML =
          this.renderFilePreviews(project.reports, "report");
      }
    }
  }

  renderFutureProjectDetails(card, project, contractor) {
    // Future project specific details
    card.querySelector(".budget").textContent = project.budget
      ? `$${project.budget.toLocaleString()}`
      : "Not specified";
    card.querySelector(".priority").textContent = project.priority
      ? project.priority.charAt(0).toUpperCase() + project.priority.slice(1)
      : "Not specified";
    card.querySelector(".preferred-contractor").textContent = contractor
      ? contractor.companyName
      : "Not assigned";
    card.querySelector(".project-manager").textContent =
      contractor && contractor.contactPerson
        ? `${contractor.contactPerson.name} (${contractor.contactPerson.position})`
        : "Not assigned";

    // Set planning details
    card.querySelector(".description").textContent =
      project.description || "No description available";
    card.querySelector(".objectives").textContent =
      project.objectives || "No objectives defined";
    card.querySelector(".risks").textContent =
      project.risks || "No risks identified";

    // Make Project Documents header collapsible
    const detailsSection = card.querySelector(".project-details");
    const documentsSection = detailsSection.querySelector(
      ".details-section:last-child"
    );
    const docHeader = documentsSection.querySelector("h4");

    // Make header collapsible
    docHeader.classList.add("collapsible-header");
    const documentsGrid = documentsSection.querySelector(".documents-grid");
    documentsGrid.classList.add("collapsible-content");

    // Add click event to toggle
    docHeader.addEventListener("click", (e) => {
      e.preventDefault();
      docHeader.classList.toggle("collapsed");
      documentsGrid.classList.toggle("collapsed");

      // Update card size after toggle
      this.updateCardSize(card);
    });

    // Set file previews
    if (project.documents && project.documents.length > 0) {
      card.querySelector(".documents-preview").innerHTML =
        this.renderFilePreviews(project.documents, "document");
    }
    if (project.specifications && project.specifications.length > 0) {
      card.querySelector(".specifications-preview").innerHTML =
        this.renderFilePreviews(project.specifications, "specification");
    }
  }

  renderFilePreviews(files, type) {
    // Проверяем, что files - это массив
    if (!files || !Array.isArray(files) || files.length === 0) {
      return "";
    }

    console.log(`Rendering file previews for ${type}:`, files);

    // Капитализируем тип для отображения
    const displayType = type.charAt(0).toUpperCase() + type.slice(1);

    // Генерируем HTML для каждого файла
    const previewsHtml = files
      .map((file) => {
        if (!file) return "";

        // Извлекаем необходимые свойства из файла
        const fileName =
          file.fileName ||
          file.original_name ||
          file.name ||
          file.file_name ||
          "Unknown file";
        let filePath = file.filePath || file.file_path || "";
        let miniPath = file.miniPath || file.mini_path || "";
        const fileId = file.fileId || file.id || "";
        const mimeType =
          file.mimeType || file.mime_type || file.type || file.file_type || "";
        const fileSize = file.fileSize || file.file_size || file.size || 0;

        // Проверяем, является ли путь относительным, и если да, добавляем базовый путь
        if (
          filePath &&
          !filePath.startsWith("http") &&
          !filePath.startsWith("/")
        ) {
          filePath = `/Maintenance_P/Inspections-Checklist-Portal/components/construction/${filePath}`;
        } else if (
          filePath &&
          !filePath.startsWith("http") &&
          !filePath.startsWith("/Maintenance_P")
        ) {
          filePath = `/Maintenance_P${filePath}`;
        }

        if (
          miniPath &&
          !miniPath.startsWith("http") &&
          !miniPath.startsWith("/")
        ) {
          miniPath = `/Maintenance_P/Inspections-Checklist-Portal/components/construction/${miniPath}`;
        } else if (
          miniPath &&
          !miniPath.startsWith("http") &&
          !miniPath.startsWith("/Maintenance_P")
        ) {
          miniPath = `/Maintenance_P${miniPath}`;
        }

        // Определяем, является ли файл изображением
        const isImage = mimeType && mimeType.startsWith("image/");

        // Определяем класс иконки для не-изображений
        let iconClass = "fas fa-file";
        if (!isImage) {
          if (mimeType.includes("pdf")) {
            iconClass = "fas fa-file-pdf";
          } else if (
            mimeType.includes("word") ||
            mimeType.includes("document")
          ) {
            iconClass = "fas fa-file-word";
          } else if (
            mimeType.includes("excel") ||
            mimeType.includes("spreadsheet")
          ) {
            iconClass = "fas fa-file-excel";
          } else if (
            mimeType.includes("powerpoint") ||
            mimeType.includes("presentation")
          ) {
            iconClass = "fas fa-file-powerpoint";
          } else if (mimeType.includes("text")) {
            iconClass = "fas fa-file-alt";
          } else if (mimeType.includes("zip") || mimeType.includes("archive")) {
            iconClass = "fas fa-file-archive";
          }
        }

        // Строим HTML для превью файла
        return `
        <div class="file-preview-item" 
             data-file-id="${fileId}" 
             data-file-path="${filePath}" 
             data-mime-type="${mimeType}">
          ${
            isImage
              ? `<img src="${miniPath || filePath}" alt="${fileName}" />`
              : `<i class="${iconClass} file-type-icon"></i>`
          }
          <div class="file-info">
            <span class="file-name" title="${fileName}">${fileName}</span>
            ${
              fileSize
                ? `<span class="file-size">${this.formatFileSize(
                    fileSize
                  )}</span>`
                : ""
            }
          </div>
          <button class="file-action-btn view-file" title="View file">
            <i class="fas fa-eye"></i>
          </button>
          <button class="file-action-btn remove-file" title="Remove file">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      })
      .join("");

    return previewsHtml;
  }

  // Helper method to get the appropriate icon class based on file MIME type
  getFileIconClass(mimeType) {
    if (!mimeType) return "fas fa-file";

    if (mimeType.startsWith("image/")) return "fas fa-file-image";
    if (mimeType === "application/pdf") return "fas fa-file-pdf";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "fas fa-file-word";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "fas fa-file-excel";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return "fas fa-file-powerpoint";
    if (mimeType.includes("text/")) return "fas fa-file-alt";
    if (mimeType.includes("zip") || mimeType.includes("compressed"))
      return "fas fa-file-archive";

    return "fas fa-file";
  }

  formatFileSize(bytes) {
    if (!bytes) return "";

    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  updateProgress(progressBar, progressText, current, total) {
    const percentage = (current / total) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `Uploading: ${Math.round(percentage)}%`;

    if (current === total) {
      setTimeout(() => {
        progressBar.style.width = "0%";
        progressText.textContent = "Uploading: 0%";
      }, 1000);
    }
  }

  onSectionChange(sectionId) {
    // Если секция не указана, используем активную
    if (!sectionId) {
      const activeSection = this.container.querySelector(
        ".construction-section.active"
      );
      if (activeSection) {
        sectionId = activeSection.id;
      } else {
        return;
      }
    }

    // Вызываем специфические действия для каждой секции
    if (sectionId === "contractors-section") {
      this.renderContractors();
    } else if (sectionId === "current-projects-section") {
      this.renderProjects("current");
    } else if (sectionId === "future-projects-section") {
      this.renderProjects("future");
    }

    // Update statistics for the active section
    if (sectionId === "current-projects-section") {
      this.updateProjectStatistics("current");
    } else if (sectionId === "future-projects-section") {
      this.updateProjectStatistics("future");
    }
  }

  async loadData() {
    try {
      // Here will be API calls to load data
      // For now using mock data
      await this.loadContractors();
      this.updateBusinessTypeFilter(); // Обновляем список типов бизнеса после загрузки
      await this.loadCurrentProjects();
      await this.loadFutureProjects();
      this.renderActiveSection();

      // Update statistics for both sections after loading data
      this.updateProjectStatistics("current");
      this.updateProjectStatistics("future");
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  switchTab(tab) {
    this.container
      .querySelectorAll(".construction-section")
      .forEach((s) => s.classList.remove("active"));

    // Update section title
    const sectionTitle = this.container.querySelector("#section-title");
    if (sectionTitle) {
      sectionTitle.textContent =
        tab === "contractors"
          ? "Contractors"
          : tab === "current-projects"
          ? "Current Projects"
          : "Future Projects";
    }

    // Show appropriate section
    this.container.querySelector(`#${tab}-section`).classList.add("active");

    // Update filters visibility
    const contractorsFilters = this.container.querySelector(
      "#contractors-filters"
    );
    const currentProjectsFilters = this.container.querySelector(
      "#current-projects-filters"
    );
    const futureProjectsFilters = this.container.querySelector(
      "#future-projects-filters"
    );

    if (contractorsFilters) {
      contractorsFilters.style.display =
        tab === "contractors" ? "flex" : "none";
    }
    if (currentProjectsFilters) {
      currentProjectsFilters.style.display =
        tab === "current-projects" ? "flex" : "none";
    }
    if (futureProjectsFilters) {
      futureProjectsFilters.style.display =
        tab === "future-projects" ? "flex" : "none";
    }

    // Update add buttons visibility
    const addContractorBtn = this.container.querySelector("#add-contractor");
    const addCurrentProjectBtn = this.container.querySelector(
      "#add-current-project"
    );
    const addFutureProjectBtn = this.container.querySelector(
      "#add-future-project"
    );

    if (addContractorBtn) {
      addContractorBtn.style.display = tab === "contractors" ? "block" : "none";
    }
    if (addCurrentProjectBtn) {
      addCurrentProjectBtn.style.display =
        tab === "current-projects" ? "block" : "none";
    }
    if (addFutureProjectBtn) {
      addFutureProjectBtn.style.display =
        tab === "future-projects" ? "block" : "none";
    }

    this.activeTab = tab;
    this.renderActiveSection();

    // Update project statistics when switching to project tabs
    if (tab === "current-projects") {
      this.updateProjectStatistics("current");
    } else if (tab === "future-projects") {
      this.updateProjectStatistics("future");
    }
  }

  renderActiveSection() {
    switch (this.activeTab) {
      case "contractors":
        this.renderContractors();
        break;
      case "current-projects":
        this.renderProjects("current");
        break;
      case "future-projects":
        this.renderProjects("future");
        break;
    }
  }

  // Методы для работы с подрядчиками
  async loadContractors() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Convert API format to client format
        this.contractors = result.data.map((contractor) => {
          return {
            id: parseInt(contractor.id),
            companyName: contractor.company_name,
            businessType: contractor.business_type,
            location: contractor.location || "",
            email: contractor.email || "",
            phone: contractor.phone || "",
            rating: parseInt(contractor.rating) || 0,
            contactPerson: contractor.contact_person
              ? {
                  id: parseInt(contractor.contact_person.id),
                  name: contractor.contact_person.name,
                  position: contractor.contact_person.position || "",
                  phone: contractor.contact_person.phone || "",
                  email: contractor.contact_person.email || "",
                }
              : {
                  name: "None",
                  position: "",
                  phone: "",
                  email: "",
                },
            employees: contractor.employees
              ? contractor.employees.map((emp) => ({
                  id: parseInt(emp.id),
                  fullName: emp.name,
                  position: emp.position || "",
                  phone: emp.phone || "",
                  email: emp.email || "",
                }))
              : [],
          };
        });
      } else {
        console.error("Failed to load contractors:", result.message);
        // Fallback to empty array
        this.contractors = [];
      }
    } catch (error) {
      console.error("Error loading contractors:", error);
      // Fallback to empty array on error
      this.contractors = [];
    }
  }

  renderContractors() {
    const container = this.container.querySelector("#contractors-list");
    if (!container) return;

    if (this.contractors.length === 0) {
      container.innerHTML = `
            <div class="no-contractors">
                <i class="fas fa-building"></i>
                <h3>No Contractors Yet</h3>
                <p>Click the "Add Contractor" button to add your first contractor</p>
            </div>
        `;
      return;
    }

    container.innerHTML = this.contractors
      .map(
        (contractor) => `
      <div class="contractor-card" data-id="${contractor.id}">
        <div class="contractor-header">
          <h3>${contractor.companyName}</h3>
          <div class="contractor-rating">
            ${this.generateRatingStars(contractor.rating)}
          </div>
        </div>
        <div class="contractor-info">
          <div class="info-item">
            <i class="fas fa-briefcase"></i>
            <span>${contractor.businessType}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-location-dot"></i>
            <span>${contractor.location}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.email}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.phone}</span>
          </div>
        </div>
        <div class="contact-person-info">
          <h4>Contact Person</h4>
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span>${contractor.contactPerson.name}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-id-badge"></i>
            <span>${contractor.contactPerson.position}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.contactPerson.phone}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.contactPerson.email}</span>
          </div>
        </div>
        <div class="contractor-employees">
          <h4>Employees (${contractor.employees.length})</h4>
          <div class="employees-list">
            ${this.renderEmployeesList(contractor.employees)}
          </div>
          <button class="btn-secondary add-employee" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-user-plus"></i> Add Employee
          </button>
        </div>
        <div class="contractor-actions">
          <button class="btn-action edit" data-contractor-id="${contractor.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action delete" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    // Добавляем обработчики событий после рендеринга
    this.bindEmployeeEvents();

    // Add event handlers for contractor edit and delete buttons
    this.container
      .querySelectorAll(".contractor-actions .btn-action.edit")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          const contractor = this.contractors.find(
            (c) => c.id === contractorId
          );
          if (contractor) {
            this.showContractorModal(contractor);
          }
        });
      });

    this.container
      .querySelectorAll(".contractor-actions .btn-action.delete")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          this.deleteContractor(contractorId);
        });
      });
  }

  renderEmployeesList(employees) {
    return employees
      .map(
        (employee) => `
        <div class="employee-item">
            <div class="employee-info">
                <strong>${employee.fullName}</strong>
                <span>${employee.position}</span>
                <span>${employee.phone}</span>
            </div>
            <div class="employee-actions">
                <button class="btn-action edit" data-employee-id="${employee.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" data-employee-id="${employee.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `
      )
      .join("");
  }

  bindEmployeeEvents() {
    // Обработчики для кнопок редактирования сотрудников
    this.container
      .querySelectorAll(".employee-actions .btn-action.edit")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const employeeId = parseInt(button.dataset.employeeId);
          const contractorId = parseInt(
            button.closest(".contractor-card").dataset.id
          );
          this.editEmployee(contractorId, employeeId);
        });
      });

    // Обработчики для кнопок удаления сотрудников
    this.container
      .querySelectorAll(".employee-actions .btn-action.delete")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const employeeId = parseInt(button.dataset.employeeId);
          const contractorId = parseInt(
            button.closest(".contractor-card").dataset.id
          );
          this.deleteEmployee(contractorId, employeeId);
        });
      });

    // Обработчики для кнопок добавления сотрудников
    this.container.querySelectorAll(".add-employee").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const contractorId = parseInt(button.dataset.contractorId);
        this.showEmployeeModal(contractorId);
      });
    });
  }

  showEmployeeModal(contractorId, employee = null) {
    const modal = this.container.querySelector("#employee-modal");
    const form = modal.querySelector("#employee-form");
    const title = modal.querySelector("#employee-modal-title");

    title.textContent = employee ? "Edit Employee" : "Add Employee";

    form.elements.contractorId.value = contractorId;

    if (employee) {
      form.elements.fullName.value = employee.fullName;
      form.elements.position.value = employee.position;
      form.elements.phone.value = employee.phone;
      form.dataset.employeeId = employee.id;
    } else {
      form.reset();
      form.elements.contractorId.value = contractorId;
      delete form.dataset.employeeId;
    }

    modal.classList.add("active");
  }

  editEmployee(contractorId, employeeId) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      const employee = contractor.employees.find((e) => e.id === employeeId);
      if (employee) {
        this.showEmployeeModal(contractorId, employee);
      }
    }
  }

  deleteEmployee(contractorId, employeeId) {
    if (confirm("Are you sure you want to delete this employee?")) {
      const contractor = this.contractors.find((c) => c.id === contractorId);
      if (contractor) {
        contractor.employees = contractor.employees.filter(
          (e) => e.id !== employeeId
        );
        this.renderContractors();
      }
    }
  }

  handleEmployeeSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const contractorId = parseInt(form.elements.contractorId.value);
    const employeeData = {
      fullName: form.elements.fullName.value,
      position: form.elements.position.value,
      phone: form.elements.phone.value,
    };

    if (form.dataset.employeeId) {
      // Редактирование существующего сотрудника
      const employeeId = parseInt(form.dataset.employeeId);
      this.updateEmployee(contractorId, employeeId, employeeData);
    } else {
      // Добавление нового сотрудника
      this.addEmployeeToContractor(contractorId, employeeData);
    }

    this.closeModals();
  }

  addEmployeeToContractor(contractorId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      // First add to local data structure for immediate feedback
      data.id = Date.now(); // Temporary ID
      contractor.employees.push(data);

      // Prepare data for API
      const existingEmployees = contractor.employees.filter(
        (e) => e.id !== data.id
      );

      const apiData = {
        company_name: contractor.companyName,
        business_type: contractor.businessType,
        location: contractor.location,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        notes: contractor.notes || "",
        employees: [
          ...existingEmployees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: 0,
          })),
          // Add new employee
          {
            name: data.fullName,
            position: data.position || "",
            phone: data.phone || "",
            email: data.email || "",
            is_primary_contact: 0,
          },
        ],
      };

      // Используем правильный URL API
      fetch(
        `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((responseData) => {
          if (responseData.success) {
            // Обновляем данные о сотрудниках из ответа API
            if (responseData.data && responseData.data.employees) {
              // Находим контрактор в массиве this.contractors и обновляем его сотрудников
              const updatedContractor = this.contractors.find(
                (c) => c.id === contractorId
              );
              if (updatedContractor) {
                // Преобразуем сотрудников из формата API в формат UI
                updatedContractor.employees = responseData.data.employees.map(
                  (emp) => ({
                    id: parseInt(emp.id),
                    fullName: emp.name,
                    position: emp.position || "",
                    phone: emp.phone || "",
                    email: emp.email || "",
                  })
                );
              }
            }

            // Перерисовываем UI для отображения обновленных данных
            this.renderContractors();
          } else {
            console.error("Error adding employee:", responseData.message);
            alert("Failed to add employee: " + responseData.message);
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          }
        })
        .catch((error) => {
          console.error("Error adding employee:", error);
          alert("Failed to add employee. Please try again.");
          // Обновляем данные с сервера в случае ошибки
          this.loadContractors().then(() => this.renderContractors());
        });

      // Render immediately for responsive UI
      this.renderContractors();
    }
  }

  updateEmployee(contractorId, employeeId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      const index = contractor.employees.findIndex((e) => e.id === employeeId);
      if (index !== -1) {
        // Update local data first
        contractor.employees[index] = {
          ...contractor.employees[index],
          ...data,
        };

        // Prepare data for API
        const apiData = {
          company_name: contractor.companyName,
          business_type: contractor.businessType,
          location: contractor.location,
          email: contractor.email,
          phone: contractor.phone,
          rating: contractor.rating,
          notes: contractor.notes || "",
          employees: contractor.employees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: e.isPrimaryContact ? 1 : 0,
          })),
        };

        // Используем правильный URL API
        fetch(
          `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiData),
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((responseData) => {
            if (responseData.success) {
              // Обновляем данные о сотрудниках из ответа API
              if (responseData.data && responseData.data.employees) {
                // Находим контрактор в массиве this.contractors и обновляем его сотрудников
                const updatedContractor = this.contractors.find(
                  (c) => c.id === contractorId
                );
                if (updatedContractor) {
                  // Преобразуем сотрудников из формата API в формат UI
                  updatedContractor.employees = responseData.data.employees.map(
                    (emp) => ({
                      id: parseInt(emp.id),
                      fullName: emp.name,
                      position: emp.position || "",
                      phone: emp.phone || "",
                      email: emp.email || "",
                    })
                  );
                }
              }

              // Перерисовываем UI для отображения обновленных данных
              this.renderContractors();
            } else {
              console.error("Error updating employee:", responseData.message);
              alert("Failed to update employee: " + responseData.message);
              // Обновляем данные с сервера в случае ошибки
              this.loadContractors().then(() => this.renderContractors());
            }
          })
          .catch((error) => {
            console.error("Error updating employee:", error);
            alert("Failed to update employee. Please try again.");
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          });

        // Render immediately for UI feedback
        this.renderContractors();
      }
    }
  }

  // Методы для работы с проектами
  async loadCurrentProjects() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?type=current"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Преобразуем свойства для совместимости с существующим кодом
        this.currentProjects = data.data.map((project) => ({
          id: project.id,
          name: project.name,
          location: project.location,
          startDate: project.start_date,
          endDate: project.end_date,
          businessType: project.business_type,
          contractorId: project.contractor_id,
          contractorName: project.contractor_name,
          contactPersonId: project.contact_person_id,
          contactPersonName: project.contact_person_name,
          status: project.status,
          progress: project.progress,
          actualCost: project.actual_cost,
          lastUpdate: project.last_update,
          files: project.files || [],
        }));
      } else {
        console.error("Error loading current projects:", data.message);
        this.currentProjects = [];
      }
    } catch (error) {
      console.error("Error loading current projects:", error);
      this.currentProjects = [];
    }
  }

  async loadFutureProjects() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/projects.php?type=future"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Преобразуем свойства для совместимости с существующим кодом
        this.futureProjects = data.data.map((project) => ({
          id: project.id,
          name: project.name,
          location: project.location,
          startDate: project.start_date,
          endDate: project.end_date,
          businessType: project.business_type,
          contractorId: project.contractor_id,
          contractorName: project.contractor_name,
          contactPersonId: project.contact_person_id,
          contactPersonName: project.contact_person_name,
          status: project.status,
          budget: project.budget,
          priority: project.priority,
          description: project.description,
          objectives: project.objectives,
          risks: project.risks,
          files: project.files || [],
        }));
      } else {
        console.error("Error loading future projects:", data.message);
        this.futureProjects = [];
      }
    } catch (error) {
      console.error("Error loading future projects:", error);
      this.futureProjects = [];
    }
  }

  renderProjects(type, projectsToRender = null) {
    const projects =
      projectsToRender ||
      (type === "current" ? this.currentProjects : this.futureProjects);
    const container = this.container.querySelector(`#${type}-projects-list`);

    if (!container) {
      console.error(`Container #${type}-projects-list not found`);
      return;
    }

    console.log(`Rendering ${type} projects:`, projects);
    container.innerHTML = "";

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>No projects found</p>
        </div>
      `;

      // Update statistics even if no projects are found
      this.updateProjectStatistics(type);
      return;
    }

    projects.forEach((project) => {
      // Организуем файлы проекта по категориям
      const organizedProject = this.organizeProjectFiles(project);

      const contractor = this.contractors.find(
        (c) => c.id === organizedProject.contractorId
      );
      const template = this.container.querySelector(
        `#${type}-project-card-template`
      );

      if (!template) {
        console.error(`Template #${type}-project-card-template not found`);
        return;
      }

      const card = template.content.cloneNode(true);

      // Set project ID
      const projectCard = card.querySelector(".project-card");
      projectCard.dataset.id = organizedProject.id;

      // Set project name and status
      card.querySelector(".project-name").textContent = organizedProject.name;
      const statusSelect = card.querySelector(".status-select");
      statusSelect.value = organizedProject.status;

      // Добавляем data-атрибут для привязки к проекту
      statusSelect.setAttribute("data-project-id", organizedProject.id);

      // Обновляем классы статуса
      this.updateStatusClasses(statusSelect, organizedProject.status);

      // Set project details
      card.querySelector(".location").textContent = organizedProject.location;

      // Форматируем даты для отображения
      const startDateFormatted = this.formatDateForDisplay(
        organizedProject.startDate
      );
      const endDateFormatted = this.formatDateForDisplay(
        organizedProject.endDate
      );
      card.querySelector(
        ".dates"
      ).textContent = `${startDateFormatted} - ${endDateFormatted}`;

      if (type === "current") {
        this.renderCurrentProjectDetails(card, organizedProject, contractor);
      } else {
        this.renderFutureProjectDetails(card, organizedProject, contractor);
      }

      // Добавляем карточку в контейнер
      container.appendChild(card);
    });

    // After rendering all projects, update the statistics
    this.updateProjectStatistics(type);

    // Bind events to project cards
    this.bindProjectCardEvents(type);

    // Привязываем события к предпросмотрам файлов
    this.bindFilePreviewEvents();

    // Добавим дополнительную логику для обработки всех изображений на странице
    this.enhanceAllImagePreviews(type);
  }

  // Метод для улучшения всех превью изображений в указанной секции
  enhanceAllImagePreviews(type) {
    // Получаем контейнер для секции
    const sectionId =
      type === "current"
        ? "current-projects-section"
        : "future-projects-section";
    const section = this.container.querySelector(`#${sectionId}`);
    if (!section) return;

    // Находим все изображения в секции
    const images = section.querySelectorAll(".file-preview-container img");
    images.forEach((img) => {
      // Проверяем, что у изображения есть src
      const src = img.getAttribute("src");
      if (src) {
        // Делаем курсор указателем
        img.style.cursor = "pointer";

        // Удаляем старые обработчики, чтобы избежать дублирования
        const newImg = img.cloneNode(true);
        img.parentNode.replaceChild(newImg, img);

        // Добавляем обработчик клика
        newImg.addEventListener("click", () => {
          console.log("Image clicked:", src);
          this.showImageModal(src);
        });
      }
    });

    console.log(`Enhanced ${images.length} images in ${type} projects section`);
  }

  updateStatusClasses(statusSelect, status) {
    // Удаляем все существующие классы статуса
    statusSelect.classList.remove(
      "planned",
      "in-progress",
      "completed",
      "on-hold",
      "move-to-current",
      "delayed",
      "design-phase", // Добавляем новые возможные статусы
      "planning"
    );

    // Преобразуем статус для использования в качестве CSS класса (заменяем пробелы на дефисы)
    const statusClass = status.replace(/\s+/g, "-").toLowerCase();

    // Добавляем новый класс статуса
    statusSelect.classList.add(statusClass);

    // Сбрасываем inline стили, которые могли быть установлены ранее
    statusSelect.style.backgroundColor = "";
    statusSelect.style.color = "";
    statusSelect.style.borderColor = "";

    // Определяем цвета в зависимости от статуса
    let colors = {
      planned: {
        bg: "#e3f2fd",
        color: "#1976d2",
        border: "#90caf9",
      },
      "in-progress": {
        bg: "#fff3e0",
        color: "#f57c00",
        border: "#ffcc80",
      },
      completed: {
        bg: "#e8f5e9",
        color: "#388e3c",
        border: "#a5d6a7",
      },
      "on-hold": {
        bg: "#ffebee",
        color: "#d32f2f",
        border: "#ef9a9a",
      },
      "move-to-current": {
        bg: "#f3e5f5",
        color: "#7b1fa2",
        border: "#ce93d8",
      },
      delayed: {
        bg: "#ffebee",
        color: "#d32f2f",
        border: "#ef9a9a",
      },
      "design-phase": {
        // Добавляем новые статусы с цветами
        bg: "#e0f7fa",
        color: "#0097a7",
        border: "#80deea",
      },
      planning: {
        bg: "#f3e5f5",
        color: "#8e24aa",
        border: "#ce93d8",
      },
    };

    // Пробуем найти цвета для статуса напрямую или для его CSS версии
    let colorConfig = colors[status] || colors[statusClass];

    // Применяем стили, если статус найден в нашем объекте
    if (colorConfig) {
      statusSelect.style.backgroundColor = colorConfig.bg;
      statusSelect.style.color = colorConfig.color;
      statusSelect.style.borderColor = colorConfig.border;
      statusSelect.style.borderWidth = "1px";
      statusSelect.style.borderStyle = "solid";
    } else {
      // Если статус неизвестен, применяем стандартные стили
      statusSelect.style.backgroundColor = "#f5f5f5";
      statusSelect.style.color = "#616161";
      statusSelect.style.borderColor = "#bdbdbd";
      statusSelect.style.borderWidth = "1px";
      statusSelect.style.borderStyle = "solid";
    }

    // Устанавливаем data-атрибут для дополнительной поддержки селекторов
    statusSelect.setAttribute("data-status", status);
  }

  // Helper method to update card size after toggle
  updateCardSize(card) {
    // Ensure card is a DOM element
    if (!card || typeof card.closest !== "function") {
      // If card is not a DOM element, try to find the project card differently
      // This handles cases where 'card' might be the project card body or another element
      const projectCard = card.parentElement
        ? card.parentElement.closest(".project-card")
        : document.querySelector(".project-card");

      if (projectCard) {
        // Set height to auto to let it resize naturally
        projectCard.style.height = "auto";
        const cardBody = projectCard.querySelector(".card-body");
        if (cardBody) {
          cardBody.style.height = "auto";
        }
      }
      return;
    }

    // Regular handling if card is a DOM element with closest method
    const projectCard = card.closest(".project-card");
    if (projectCard) {
      // Ensure card body expands/contracts with content
      const cardBody = projectCard.querySelector(".card-body");
      if (cardBody) {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          // Reset any fixed heights
          cardBody.style.height = "";
          projectCard.style.height = "";

          // Calculate and set new height
          const height = cardBody.scrollHeight;
          cardBody.style.height = height + "px";

          // Allow height to adjust naturally after initial animation
          setTimeout(() => {
            cardBody.style.height = "auto";
          }, 300);
        }, 10);
      }
    }
  }

  renderCurrentProjectDetails(card, project, contractor) {
    // Set current project specific details
    card.querySelector(".progress").textContent = project.progress
      ? `${project.progress}%`
      : "Not started";
    card.querySelector(".actual-cost").textContent = project.actualCost
      ? `$${project.actualCost.toLocaleString()}`
      : "Not specified";
    card.querySelector(".contractor").textContent = contractor
      ? contractor.companyName
      : "Not assigned";
    card.querySelector(".project-manager").textContent =
      contractor && contractor.contactPerson
        ? `${contractor.contactPerson.name} (${contractor.contactPerson.position})`
        : "Not assigned";

    // Форматируем дату последнего обновления
    const lastUpdateFormatted = project.lastUpdate
      ? this.formatDateForDisplay(project.lastUpdate)
      : "Not updated";
    card.querySelector(".last-update").textContent = lastUpdateFormatted;

    // Определяем, является ли проект перенесенным из Future в Current
    const isMigratedProject =
      project.description ||
      project.objectives ||
      project.risks ||
      project.priority ||
      (project.specifications && project.specifications.length > 0) ||
      (project.budgetDocs && project.budgetDocs.length > 0) ||
      (project.documents &&
        project.documents.length > 0 &&
        project.migratedFromFuture);

    const detailsSection = card.querySelector(".project-details");

    // Make Project Documents header collapsible
    const documentsSection = detailsSection.querySelector(
      ".details-section:last-child"
    );
    const docHeader = documentsSection.querySelector("h4");

    // Make header collapsible
    docHeader.classList.add("collapsible-header");
    const documentsGrid = documentsSection.querySelector(".documents-grid");
    documentsGrid.classList.add("collapsible-content");

    // Add click event to toggle
    docHeader.addEventListener("click", (e) => {
      e.preventDefault();
      docHeader.classList.toggle("collapsed");
      documentsGrid.classList.toggle("collapsed");

      // Update card size after toggle - pass the project card element
      this.updateCardSize(docHeader.closest(".project-card"));
    });

    // Reorganize documents grid - group migrated files at the top
    if (isMigratedProject) {
      // Clear existing content
      documentsGrid.innerHTML = "";

      // Add a collapsible header for migrated files
      const migratedHeader = document.createElement("div");
      migratedHeader.className = "section-header";
      migratedHeader.innerHTML = `
        <h4 class="toggle-documents">
          <i class="fas fa-chevron-down"></i> 
          <span class="from-future-flag">From Future Project</span>
        </h4>
      `;
      documentsGrid.appendChild(migratedHeader);

      // Create migrated files group
      const migratedFilesGroup = document.createElement("div");
      migratedFilesGroup.className = "migrated-files-group documents-content";
      documentsGrid.appendChild(migratedFilesGroup);

      // Make sure content is fully visible with scrolling if needed
      migratedFilesGroup.style.overflowY = "visible";
      migratedFilesGroup.style.maxHeight = "none";
      documentsGrid.style.overflowY = "visible";

      // Add Planning Documents (formerly called Documents in Future Projects) if they exist
      if (
        project.documents &&
        project.documents.length > 0 &&
        project.migratedFromFuture
      ) {
        const planningDocsGroup = document.createElement("div");
        planningDocsGroup.className = "documents-group migrated-files";
        planningDocsGroup.innerHTML = `
          <h5>Planning Documents</h5>
          <div class="planning-docs-preview file-preview-container">
            ${this.renderFilePreviews(project.documents, "document")}
          </div>
        `;
        migratedFilesGroup.appendChild(planningDocsGroup);
      }

      // Add specifications if they exist
      if (project.specifications && project.specifications.length > 0) {
        const specificationsGroup = document.createElement("div");
        specificationsGroup.className = "documents-group migrated-files";
        specificationsGroup.innerHTML = `
          <h5>Specifications</h5>
          <div class="specifications-preview file-preview-container">
            ${this.renderFilePreviews(project.specifications, "specification")}
          </div>
        `;
        migratedFilesGroup.appendChild(specificationsGroup);
      }

      // Add budget documents if they exist
      if (project.budgetDocs && project.budgetDocs.length > 0) {
        const budgetDocsGroup = document.createElement("div");
        budgetDocsGroup.className = "documents-group migrated-files";
        budgetDocsGroup.innerHTML = `
          <h5>Budget Documents</h5>
          <div class="budget-docs-preview file-preview-container">
            ${this.renderFilePreviews(project.budgetDocs, "budgetDoc")}
          </div>
        `;
        migratedFilesGroup.appendChild(budgetDocsGroup);
      }

      // Add a collapsible header for current files
      const currentHeader = document.createElement("div");
      currentHeader.className = "section-header";
      currentHeader.innerHTML = `
        <h4 class="toggle-documents">
          <i class="fas fa-chevron-down"></i> 
          <span class="current-files-title">Current Project Files</span>
        </h4>
      `;
      documentsGrid.appendChild(currentHeader);

      // Create current files group
      const currentFilesGroup = document.createElement("div");
      currentFilesGroup.className = "current-files-group documents-content";
      documentsGrid.appendChild(currentFilesGroup);

      // Add current files (Photos, Reports)
      // Photos
      if (project.photos && project.photos.length > 0) {
        const photosGroup = document.createElement("div");
        photosGroup.className = "documents-group";
        photosGroup.innerHTML = `
          <h5>Photos</h5>
          <div class="photos-preview file-preview-container">
            ${this.renderFilePreviews(project.photos, "photo")}
          </div>
        `;
        currentFilesGroup.appendChild(photosGroup);
      } else {
        const photosGroup = document.createElement("div");
        photosGroup.className = "documents-group";
        photosGroup.innerHTML = `
          <h5>Photos</h5>
          <div class="photos-preview file-preview-container"></div>
        `;
        currentFilesGroup.appendChild(photosGroup);
      }

      // Reports
      if (project.reports && project.reports.length > 0) {
        const reportsGroup = document.createElement("div");
        reportsGroup.className = "documents-group";
        reportsGroup.innerHTML = `
          <h5>Reports</h5>
          <div class="reports-preview file-preview-container">
            ${this.renderFilePreviews(project.reports, "report")}
          </div>
        `;
        currentFilesGroup.appendChild(reportsGroup);
      } else {
        const reportsGroup = document.createElement("div");
        reportsGroup.className = "documents-group";
        reportsGroup.innerHTML = `
          <h5>Reports</h5>
          <div class="reports-preview file-preview-container"></div>
        `;
        currentFilesGroup.appendChild(reportsGroup);
      }

      // Add toggle functionality for each section individually
      const toggleSections = card.querySelectorAll(".toggle-documents");
      toggleSections.forEach((toggle) => {
        toggle.addEventListener("click", (e) => {
          const content = toggle.closest(".section-header").nextElementSibling;
          content.classList.toggle("collapsed");
          const icon = toggle.querySelector("i");
          icon.classList.toggle("fa-chevron-down");
          icon.classList.toggle("fa-chevron-right");

          // Update card size after toggle
          this.updateCardSize(toggle.closest(".project-card"));
        });
      });
    } else {
      // Just set file previews without reorganization
      if (project.photos && project.photos.length > 0) {
        card.querySelector(".photos-preview").innerHTML =
          this.renderFilePreviews(project.photos, "photo");
      }
      if (project.documents && project.documents.length > 0) {
        card.querySelector(".documents-preview").innerHTML =
          this.renderFilePreviews(project.documents, "document");
      }
      if (project.reports && project.reports.length > 0) {
        card.querySelector(".reports-preview").innerHTML =
          this.renderFilePreviews(project.reports, "report");
      }
    }
  }

  renderFutureProjectDetails(card, project, contractor) {
    // Future project specific details
    card.querySelector(".budget").textContent = project.budget
      ? `$${project.budget.toLocaleString()}`
      : "Not specified";
    card.querySelector(".priority").textContent = project.priority
      ? project.priority.charAt(0).toUpperCase() + project.priority.slice(1)
      : "Not specified";
    card.querySelector(".preferred-contractor").textContent = contractor
      ? contractor.companyName
      : "Not assigned";
    card.querySelector(".project-manager").textContent =
      contractor && contractor.contactPerson
        ? `${contractor.contactPerson.name} (${contractor.contactPerson.position})`
        : "Not assigned";

    // Set planning details
    card.querySelector(".description").textContent =
      project.description || "No description available";
    card.querySelector(".objectives").textContent =
      project.objectives || "No objectives defined";
    card.querySelector(".risks").textContent =
      project.risks || "No risks identified";

    // Make Project Documents header collapsible
    const detailsSection = card.querySelector(".project-details");
    const documentsSection = detailsSection.querySelector(
      ".details-section:last-child"
    );
    const docHeader = documentsSection.querySelector("h4");

    // Make header collapsible
    docHeader.classList.add("collapsible-header");
    const documentsGrid = documentsSection.querySelector(".documents-grid");
    documentsGrid.classList.add("collapsible-content");

    // Add click event to toggle
    docHeader.addEventListener("click", (e) => {
      e.preventDefault();
      docHeader.classList.toggle("collapsed");
      documentsGrid.classList.toggle("collapsed");

      // Update card size after toggle
      this.updateCardSize(card);
    });

    // Set file previews
    if (project.documents && project.documents.length > 0) {
      card.querySelector(".documents-preview").innerHTML =
        this.renderFilePreviews(project.documents, "document");
    }
    if (project.specifications && project.specifications.length > 0) {
      card.querySelector(".specifications-preview").innerHTML =
        this.renderFilePreviews(project.specifications, "specification");
    }
  }

  getFileIcon(fileType) {
    if (fileType.startsWith("image/")) return "fas fa-image";
    if (fileType.includes("pdf")) return "fas fa-file-pdf";
    if (fileType.includes("word")) return "fas fa-file-word";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "fas fa-file-excel";
    return "fas fa-file";
  }

  addFilePreview(file, container, type) {
    // Проверяем, существует ли файл
    if (!file) return;

    console.log("Adding file preview:", file); // Для отладки

    // Получаем имя файла, используя свойства originalName или name
    const fileName =
      file.originalName && file.originalName.trim() !== ""
        ? file.originalName
        : file.name && file.name.trim() !== ""
        ? file.name
        : `${type.charAt(0).toUpperCase() + type.slice(1)} File`;

    // Создаем элемент для превью файла
    const previewItem = document.createElement("div");
    previewItem.className = "file-preview-item";
    previewItem.dataset.fileType = type;
    previewItem.dataset.fileName = fileName;

    // Всегда устанавливаем тип MIME для фотографий
    if (type === "photo") {
      previewItem.dataset.mimeType = file.type || "image/jpeg";
    } else {
      previewItem.dataset.mimeType = file.type || "application/octet-stream";
    }

    // Проверяем, является ли файл изображением - для фото это всегда true
    const isImage =
      type === "photo" ||
      file.type?.startsWith("image/") ||
      (fileName && fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif)$/i));

    console.log("Is image:", isImage, "Type:", type, "File type:", file.type); // Для отладки

    // Если это изображение, создаем превью
    if (isImage) {
      const img = document.createElement("img");
      try {
        // Используем существующий URL или создаем новый
        if (file.src) {
          console.log("Using existing src:", file.src); // Для отладки
          img.src = file.src;
        } else if (file instanceof Blob || file instanceof File) {
          console.log("Creating new blob URL"); // Для отладки
          const imgUrl = URL.createObjectURL(file);
          img.src = imgUrl;
          previewItem.dataset.imgUrl = imgUrl; // Сохраняем URL для последующего освобождения
        } else if (file.file instanceof Blob || file.file instanceof File) {
          // Иногда файл может быть обернут в объект с полем file
          console.log("Creating new blob URL from file.file"); // Для отладки
          const imgUrl = URL.createObjectURL(file.file);
          img.src = imgUrl;
          previewItem.dataset.imgUrl = imgUrl;
        } else {
          // Если у нас нет прямого доступа к блобу, попробуем использовать base64 или путь к файлу
          console.log("Trying to use file data or path"); // Для отладки
          if (file.data) {
            // Если есть данные в base64
            img.src = file.data;
          } else if (file.path) {
            // Если есть путь к файлу
            img.src = file.path;
          } else if (file.miniUrl) {
            // Если есть путь к миниатюре
            img.src = file.miniUrl;
          } else if (file.url) {
            // Если есть путь к полноразмерному файлу
            img.src = file.url;
          } else if (fileName) {
            // Последняя попытка - формируем путь по имени файла
            img.src = `components/construction/project_upload/project_mini/mini_${fileName}`;
          } else {
            // Последняя попытка - если файл - это строка с URL или данными base64
            img.src = typeof file === "string" ? file : "";
          }
        }

        // Улучшенная обработка ошибок загрузки изображения
        img.onerror = () => {
          console.error("Error loading image:", img.src);
          img.remove();
          // Если не удалось загрузить изображение, используем иконку
          const iconDiv = document.createElement("div");
          iconDiv.className = "file-type-icon";
          iconDiv.innerHTML = `<i class="fas fa-image"></i>`;
          previewItem.appendChild(iconDiv);
        };

        // Убедимся, что изображение добавится в DOM даже если оно закэшировано и onload не сработает
        if (img.complete) {
          previewItem.appendChild(img);
        } else {
          img.onload = () => {
            // Изображение успешно загрузилось
            console.log("Image loaded successfully:", img.src);
          };
          previewItem.appendChild(img);
        }
      } catch (error) {
        console.error("Ошибка создания превью изображения:", error);
        // Если не удалось создать превью, используем иконку
        const iconDiv = document.createElement("div");
        iconDiv.className = "file-type-icon";
        iconDiv.innerHTML = `<i class="fas fa-image"></i>`;
        previewItem.appendChild(iconDiv);
      }
    } else {
      // Для не-изображений показываем иконку типа файла
      const iconDiv = document.createElement("div");
      iconDiv.className = "file-type-icon";
      const fileIcon = this.getFileIcon(
        file.type || "application/octet-stream"
      );
      iconDiv.innerHTML = `<i class="${fileIcon}"></i>`;
      previewItem.appendChild(iconDiv);
    }

    // Добавляем имя файла
    const nameElement = document.createElement("div");
    nameElement.className = "file-name";
    nameElement.textContent = fileName;
    previewItem.appendChild(nameElement);

    // Добавляем скрытое поле для хранения оригинального имени, если оно есть
    if (file.originalName && file.originalName !== fileName) {
      previewItem.dataset.originalFileName = file.originalName;
    }

    // Добавляем кнопку удаления
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-file";
    removeBtn.innerHTML = "×";
    removeBtn.title = "Remove file";
    previewItem.appendChild(removeBtn);

    // Добавляем превью в контейнер
    container.appendChild(previewItem);

    // Привязываем события к новому превью
    this.bindFilePreviewEvents(container);
  }

  bindProjectCardEvents(type) {
    // Status change handler
    const statusSelects = document.querySelectorAll(`.status-select`);
    statusSelects.forEach((select) => {
      select.addEventListener("change", (e) => {
        e.stopPropagation();
        // Получаем ID проекта из ближайшей карточки
        const projectCard = e.target.closest(".project-card");
        const projectId = parseInt(projectCard.dataset.id);
        const newStatus = e.target.value;

        // Определяем тип проекта на основе родительского контейнера
        const projectsList = projectCard.closest(".projects-grid");
        const projectType =
          projectsList.id === "current-projects-list" ? "current" : "future";

        this.updateProjectStatus(projectId, newStatus, projectType);
      });
    });

    // Add click handler for project card images
    const projectCards = document.querySelectorAll(".project-card");
    projectCards.forEach((card) => {
      const cardImage = card.querySelector(".project-image img");
      if (cardImage) {
        cardImage.addEventListener("click", (e) => {
          e.stopPropagation();
          const imageSrc = cardImage.src;
          if (imageSrc) {
            this.showImageModal(imageSrc);
          }
        });
      }
    });

    // Toggle details button handler
    const toggleButtons = document.querySelectorAll(".btn-toggle-details");
    toggleButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const projectCard = e.target.closest(".project-card");
        if (projectCard) {
          const detailsSection = projectCard.querySelector(".project-details");
          if (detailsSection) {
            button.classList.toggle("active");
            detailsSection.classList.toggle("active");
            const icon = button.querySelector("i");
            if (icon) {
              icon.style.transform = button.classList.contains("active")
                ? "rotate(180deg)"
                : "rotate(0)";
            }

            // Если детали были открыты, добавляем обработчики для файловых превью
            if (detailsSection.classList.contains("active")) {
              this.bindFilePreviewEvents(detailsSection);
            }
          }
        }
      });
    });

    // Edit project handler
    this.container.querySelectorAll(".edit-project").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const projectCard = button.closest(".project-card");
        const projectId = parseInt(projectCard.dataset.id);
        const projectsList = projectCard.closest(".projects-grid");
        const projectType =
          projectsList.id === "current-projects-list" ? "current" : "future";
        const project = this.getProjectById(projectId, projectType);
        if (project) {
          this.showProjectModal(projectType, project);
        }
      });
    });

    // Delete project handler
    this.container.querySelectorAll(".delete-project").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const projectCard = button.closest(".project-card");
        const projectId = parseInt(projectCard.dataset.id);
        const projectsList = projectCard.closest(".projects-grid");
        const projectType =
          projectsList.id === "current-projects-list" ? "current" : "future";
        if (confirm("Are you sure you want to delete this project?")) {
          this.deleteProject(projectId, projectType);
        }
      });
    });
  }

  // Добавляем новый метод для привязки обработчиков к превью файлов
  bindFilePreviewEvents(container = null) {
    // Если контейнер не указан, привязываем обработчики ко всем превью файлов
    if (!container) {
      // Получаем все контейнеры с превью файлов
      const containers = this.container.querySelectorAll(
        ".file-preview-container"
      );
      containers.forEach((container) => this.bindFilePreviewEvents(container));
      return;
    }

    // Handle clicks on file preview items
    const fileItems = container.querySelectorAll(".file-preview-item");

    fileItems.forEach((item) => {
      // Get file info
      const fileId = item.dataset.fileId;
      const filePath = item.dataset.filePath;
      const mimeType = item.dataset.mimeType;

      // View file button - open in new tab or in modal
      const viewButton = item.querySelector(".view-file");
      if (viewButton) {
        viewButton.addEventListener("click", (e) => {
          e.stopPropagation();
          console.log("Opening file:", filePath);

          if (mimeType && mimeType.startsWith("image/")) {
            // Show image in modal
            this.showImageModal(filePath);
          } else {
            // Open other file types in a new tab
            window.open(filePath, "_blank");
          }
        });
      }

      // Remove file button - delete file from project
      const removeButton = item.querySelector(".remove-file");
      if (removeButton) {
        removeButton.addEventListener("click", (e) => {
          e.stopPropagation();
          if (confirm("Are you sure you want to delete this file?")) {
            console.log("Deleting file:", fileId);
            this.deleteProjectFile(fileId);
          }
        });
      }

      // Click on image thumbnail - show in modal
      const imgElement = item.querySelector("img");
      if (imgElement && mimeType && mimeType.startsWith("image/")) {
        imgElement.addEventListener("click", (e) => {
          e.stopPropagation();
          this.showImageModal(filePath);
        });
      }

      // Make the whole item clickable for images
      if (mimeType && mimeType.startsWith("image/")) {
        item.style.cursor = "pointer";
        item.addEventListener("click", () => {
          this.showImageModal(filePath);
        });
      }
    });

    // Также обработаем отдельные изображения, которые могут быть добавлены
    // напрямую в контейнер превью (не в .file-preview-item)
    const directImages = container.querySelectorAll(
      "img:not(.file-preview-item img)"
    );
    directImages.forEach((img) => {
      const src = img.getAttribute("src");
      if (src) {
        img.style.cursor = "pointer";
        img.addEventListener("click", () => {
          this.showImageModal(src);
        });
      }
    });
  }

  // Show image in modal
  showImageModal(imageSrc) {
    // Use the existing image modal in the HTML
    const imageModal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");

    if (imageModal && modalImage) {
      // Set image source and show modal
      modalImage.src = imageSrc;
      imageModal.style.display = "block";

      // Add Escape key handler
      const escKeyHandler = (e) => {
        if (e.key === "Escape") {
          imageModal.style.display = "none";
          document.removeEventListener("keydown", escKeyHandler);
        }
      };
      document.addEventListener("keydown", escKeyHandler);

      // Make sure close button works
      const closeBtn = imageModal.querySelector(".close-modal");
      if (closeBtn) {
        // Remove any existing handlers to prevent duplicates
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

        newCloseBtn.addEventListener("click", () => {
          imageModal.style.display = "none";
          document.removeEventListener("keydown", escKeyHandler);
        });
      }

      // Close on click outside the image
      const clickOutsideHandler = (e) => {
        if (e.target === imageModal) {
          imageModal.style.display = "none";
          imageModal.removeEventListener("click", clickOutsideHandler);
          document.removeEventListener("keydown", escKeyHandler);
        }
      };

      // Remove any existing handlers to prevent duplicates
      imageModal.removeEventListener("click", clickOutsideHandler);
      imageModal.addEventListener("click", clickOutsideHandler);
    } else {
      // Fallback to the old implementation if the HTML modal is not found
      // Create modal if it doesn't exist
      let modal = document.querySelector(".image-preview-modal");

      if (!modal) {
        modal = document.createElement("div");
        modal.className = "image-preview-modal";
        modal.innerHTML = `
          <div class="image-preview-content">
            <span class="image-preview-close">&times;</span>
            <img class="image-preview-img">
          </div>
        `;
        document.body.appendChild(modal);

        // Add close functionality
        const closeBtn = modal.querySelector(".image-preview-close");
        closeBtn.addEventListener("click", () => {
          modal.style.display = "none";
        });

        // Close on click outside the image
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.style.display = "none";
          }
        });

        // Add Escape key handler
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && modal.style.display === "block") {
            modal.style.display = "none";
          }
        });
      }

      // Set image source and show modal
      const img = modal.querySelector(".image-preview-img");
      img.src = imageSrc;
      modal.style.display = "block";
    }
  }

  // Delete project file
  deleteProjectFile(fileId) {
    if (!fileId) return;

    fetch(
      `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/files.php?id=${fileId}`,
      {
        method: "DELETE",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("File deleted successfully");
          // Refresh the current view
          const activeSection = this.activeTab || "current-projects";
          const type =
            activeSection === "current-projects" ? "current" : "future";

          // Reload the respective projects
          if (type === "current") {
            this.loadCurrentProjects().then(() =>
              this.renderProjects("current")
            );
          } else {
            this.loadFutureProjects().then(() => this.renderProjects("future"));
          }
        } else {
          alert("Error deleting file: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error deleting file:", error);
        alert("Error deleting file. Please try again.");
      });
  }

  handleProjectAction(projectId, action) {
    const projectCard = document.querySelector(
      `.project-card[data-project-id="${projectId}"]`
    );
    if (!projectCard) return;

    const projectsList = projectCard.closest(".projects-grid");
    const projectType =
      projectsList.id === "current-projects-list" ? "current" : "future";
    const project = this.getProjectById(projectId, projectType);

    if (!project) return;

    switch (action) {
      case "edit":
        this.showProjectModal(projectType, project);
        break;
      case "delete":
        if (confirm("Are you sure you want to delete this project?")) {
          this.deleteProject(projectId, projectType);
        }
        break;
      default:
        console.warn("Unknown project action:", action);
    }
  }

  showFilePreview(file) {
    const modal = this.container.querySelector(".preview-modal");
    const previewContent = modal.querySelector(".preview-content img");

    if (file.type.startsWith("image/")) {
      previewContent.src = URL.createObjectURL(file);
      modal.classList.add("active");
    } else {
      // For non-image files, you might want to show a different preview or download option
      window.open(URL.createObjectURL(file), "_blank");
    }
  }

  closeFilePreview() {
    const modal = this.container.querySelector(".preview-modal");
    const previewContent = modal.querySelector(".preview-content img");

    if (previewContent.src) {
      URL.revokeObjectURL(previewContent.src);
    }

    modal.classList.remove("active");
  }

  getProjectById(id, type) {
    // Убедимся, что id - это число
    id = parseInt(id);

    if (isNaN(id)) {
      console.error("Invalid project ID:", id);
      return null;
    }

    const projects =
      type === "current" ? this.currentProjects : this.futureProjects;
    return projects.find((p) => p.id === id) || null;
  }

  // Метод для синхронизации удаленных файлов в перенесенном проекте
  syncDeletedFiles(sourceProject, targetProject) {
    if (!sourceProject || !targetProject) return targetProject;

    // Синхронизируем Photos
    if (
      targetProject.photos &&
      Array.isArray(targetProject.photos) &&
      sourceProject.photos &&
      Array.isArray(sourceProject.photos)
    ) {
      // Создаем карту файлов из исходного проекта
      const sourcePhotoMap = {};
      sourceProject.photos.forEach((photo) => {
        if (photo && photo.name) {
          const key = photo.name || photo.originalName;
          sourcePhotoMap[key] = true;
        }
      });

      // Фильтруем фотографии, оставляя только те, которые есть в исходном проекте
      targetProject.photos = targetProject.photos.filter((photo) => {
        if (!photo) return false;
        const key = photo.name || photo.originalName;
        return sourcePhotoMap[key];
      });
    }

    // Синхронизируем Specifications
    if (sourceProject.specifications && targetProject.specifications) {
      const sourceFileMap = {};
      sourceProject.specifications.forEach((file) => {
        const key = `${file.name}-${file.type}`;
        sourceFileMap[key] = true;
      });

      targetProject.specifications = targetProject.specifications.filter(
        (file) => {
          const key = `${file.name}-${file.type}`;
          return sourceFileMap[key];
        }
      );

      // Пометим все specifications как мигрированные
      targetProject.specifications = targetProject.specifications.map(
        (file) => {
          return { ...file, migratedFromFuture: true };
        }
      );
    }

    // Синхронизируем Documents - копируем документы из исходного проекта в целевой
    if (sourceProject.documents && targetProject.documents) {
      const sourceFileMap = {};
      sourceProject.documents.forEach((file) => {
        const key = `${file.name}-${file.type}`;
        sourceFileMap[key] = true;
      });

      targetProject.documents = targetProject.documents.filter((file) => {
        const key = `${file.name}-${file.type}`;
        return sourceFileMap[key];
      });

      // Mark all documents as migrated from future
      targetProject.documents = targetProject.documents.map((file) => {
        return { ...file, migratedFromFuture: true };
      });
    }

    return targetProject;
  }

  // Method to synchronize deleted photos between card and edit form
  syncDeletedPhotos(fileItem, project) {
    if (!project || !fileItem) return;

    const fileType = fileItem.dataset.fileType;
    const fileName = fileItem.dataset.fileName;

    if (!fileName) return;

    // Determine which array to update based on file type
    let fileArray;
    switch (fileType) {
      case "photo":
        fileArray = project.photos;
        break;
      case "document":
        fileArray = project.documents;
        break;
      case "report":
        fileArray = project.reports;
        break;
      case "specification":
        fileArray = project.specifications;
        break;
      case "budgetDoc":
        fileArray = project.budgetDocs;
        break;
      default:
        return;
    }

    // Remove the file from the array if it exists
    if (fileArray && Array.isArray(fileArray)) {
      const index = fileArray.findIndex(
        (file) => file.name === fileName || file.originalName === fileName
      );
      if (index !== -1) {
        fileArray.splice(index, 1);
      }
    }
  }

  // Method to display image preview in modal
  showFilePreviewModal(imageSrc) {
    const modal = this.container.querySelector(".preview-modal");
    if (!modal) return;

    const previewImage = modal.querySelector("img");
    if (previewImage) {
      previewImage.src = imageSrc;

      // Add error handler in case the image fails to load
      previewImage.onerror = () => {
        console.error("Failed to load image:", imageSrc);
        previewImage.src = ""; // Clear the source to prevent further errors
        modal.style.display = "none";
      };

      // Display the modal
      modal.style.display = "flex";

      // Add event listener to close button if not already added
      const closeButton = modal.querySelector(".close-preview");
      if (closeButton && !closeButton.hasClickListener) {
        closeButton.addEventListener("click", () => {
          modal.style.display = "none";
        });
        closeButton.hasClickListener = true;
      }

      // Add event listener to close modal on background click
      if (!modal.hasClickListener) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.style.display = "none";
          }
        });
        modal.hasClickListener = true;
      }
    }
  }

  // Methods for formatting dates
  formatDateForDisplay(dateString) {
    if (!dateString) return "";

    // Поддержка различных форматов даты
    let date;

    if (typeof dateString === "object" && dateString instanceof Date) {
      date = dateString;
    } else {
      // Проверяем формат YYYY-MM-DD (из базы данных)
      if (
        typeof dateString === "string" &&
        dateString.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        const [year, month, day] = dateString.split("-");
        date = new Date(year, month - 1, day);
      } else {
        // Пытаемся разобрать строку как дату
        date = new Date(dateString);
      }
    }

    // Проверяем, что получилась корректная дата
    if (isNaN(date.getTime())) return "";

    // Форматируем дату в формат MM/DD/YYYY
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  }

  // Функция для преобразования даты в формат YYYY-MM-DD для API
  formatDateForAPI(dateString) {
    if (!dateString || typeof dateString !== "string") {
      return null; // Return null for empty values instead of passing through
    }

    // Проверяем формат даты MM/DD/YYYY и преобразуем в YYYY-MM-DD
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [month, day, year] = dateString.split("/");
      return `${year}-${month}-${day}`;
    }

    // Check MM-DD-YYYY format
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [month, day, year] = dateString.split("-");
      return `${year}-${month}-${day}`;
    }

    // Already in YYYY-MM-DD format
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }

    // Try to parse with Date object as fallback
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
      }
    } catch (e) {
      console.error("Error parsing date:", e);
    }

    // If all else fails, return null to avoid database errors
    return null;
  }

  // Method to initialize the ratings system
  setupRatingHandlers() {
    // Handle star rating in contractor list
    this.container.addEventListener("click", (e) => {
      const star = e.target.closest(".star, .fa-star");
      if (star) {
        // Handle star clicks in the contractor cards (list view)
        const contractorCard = star.closest(".contractor-card");
        if (contractorCard) {
          const contractorId = parseInt(contractorCard.dataset.id);
          const rating = parseInt(
            star.dataset.rating || star.parentElement.dataset.rating
          );
          this.setContractorRating(contractorId, rating);
        }

        // Handle star clicks in the contractor modal (add/edit form)
        const ratingContainer = star.closest(".rating");
        if (ratingContainer && !contractorCard) {
          const modal = star.closest("#contractor-modal");
          if (modal) {
            const rating = parseInt(
              star.dataset.rating || star.parentElement.dataset.rating
            );
            const form = modal.querySelector("#contractor-form");

            // Update hidden input value
            form.elements.rating.value = rating;

            // Update stars visual representation
            ratingContainer.querySelectorAll("i").forEach((icon, index) => {
              if (index < rating) {
                icon.className = "fas fa-star";
              } else {
                icon.className = "far fa-star";
              }
            });
          }
        }
      }
    });
  }

  // Helper method to generate star rating HTML
  generateRatingStars(rating, interactive = true) {
    const maxRating = 5;
    let starsHtml = "";

    for (let i = 1; i <= maxRating; i++) {
      const starClass = i <= rating ? "fas fa-star" : "far fa-star";
      starsHtml += `<span class="star ${
        interactive ? "interactive" : ""
      }" data-rating="${i}"><i class="${starClass}"></i></span>`;
    }

    return starsHtml;
  }

  // Method to handle changing contractor rating
  handleRating(contractorId, rating) {
    this.setContractorRating(contractorId, rating);
  }

  // Method to set contractor rating
  setContractorRating(contractorId, rating) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      contractor.rating = rating;
      this.renderContractors();

      // Here should be API call to update rating
    }
  }

  // Method to update project statistics
  updateProjectStatistics(type) {
    const projects =
      type === "current" ? this.currentProjects : this.futureProjects;
    const statsContainer = this.container.querySelector(
      `#${type}-projects-stats`
    );

    if (!statsContainer) return;

    // Calculate statistics
    const totalProjects = projects.length;
    const statusCounts = {
      planned: 0,
      "in-progress": 0,
      "In Progress": 0,
      completed: 0,
      "on-hold": 0,
      delayed: 0,
      "move-to-current": 0,
      "Design Phase": 0,
      "design-phase": 0,
      Planning: 0,
      planning: 0,
    };

    // Приоритеты для будущих проектов
    const priorityCounts = {
      high: 0,
      medium: 0,
      low: 0,
    };

    // Count projects by status and priority
    projects.forEach((project) => {
      if (project.status in statusCounts) {
        statusCounts[project.status]++;
      } else {
        // Проверяем нормализованную версию статуса (в нижнем регистре с дефисами вместо пробелов)
        const normalizedStatus = project.status
          .toLowerCase()
          .replace(/\s+/g, "-");
        if (normalizedStatus in statusCounts) {
          statusCounts[normalizedStatus]++;
        }
      }

      // Подсчитываем проекты по приоритету для Future Projects
      if (type === "future" && project.priority in priorityCounts) {
        priorityCounts[project.priority]++;
      }
    });

    // Комбинируем счетчики для статусов с разными форматами написания
    const completedCount = statusCounts["completed"];
    const inProgressCount =
      statusCounts["in-progress"] + statusCounts["In Progress"];
    const onHoldCount = statusCounts["on-hold"];
    const delayedCount = statusCounts["delayed"];
    const designPhaseCount =
      statusCounts["Design Phase"] + statusCounts["design-phase"];
    const planningCount = statusCounts["Planning"] + statusCounts["planning"];

    // Разные шаблоны для Current и Future Projects
    if (type === "current") {
      // Update the stats display for Current Projects
      statsContainer.innerHTML = `
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">Total Projects:</span>
            <span class="stat-value" id="current-projects-total">${totalProjects}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Completed:</span>
            <span class="stat-value stat-completed" id="current-projects-completed">${completedCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">In Progress:</span>
            <span class="stat-value stat-in-progress" id="current-projects-in-progress">${inProgressCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Design Phase:</span>
            <span class="stat-value stat-design" id="current-projects-design">${designPhaseCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Planning:</span>
            <span class="stat-value stat-planning" id="current-projects-planning">${planningCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">On Hold:</span>
            <span class="stat-value stat-on-hold" id="current-projects-on-hold">${onHoldCount}</span>
          </div>
        </div>
      `;
    } else {
      // Update the stats display for Future Projects
      statsContainer.innerHTML = `
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">Total Planned:</span>
            <span class="stat-value" id="future-projects-total">${totalProjects}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">High Priority:</span>
            <span class="stat-value stat-high" id="future-projects-high">${priorityCounts["high"]}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Medium Priority:</span>
            <span class="stat-value stat-medium" id="future-projects-medium">${priorityCounts["medium"]}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Low Priority:</span>
            <span class="stat-value stat-low" id="future-projects-low">${priorityCounts["low"]}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Delayed:</span>
            <span class="stat-value stat-delayed" id="future-projects-delayed">${delayedCount}</span>
          </div>
        </div>
      `;
    }

    // Add styles if they don't exist
    if (!document.getElementById("project-stats-styles")) {
      const statsStyles = document.createElement("style");
      statsStyles.id = "project-stats-styles";
      statsStyles.innerHTML = `
        .stats-container {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .stat-item {
          text-align: center;
          padding: 0 15px;
          border-right: 1px solid #ddd;
          flex: 1;
        }
        
        .stat-item:last-child {
          border-right: none;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #0088cc;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 0.9rem;
          color: #6c757d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-completed {
          color: #388e3c;
        }
        
        .stat-in-progress {
          color: #f57c00;
        }
        
        .stat-on-hold {
          color: #d32f2f;
        }
        
        .stat-high {
          color: #d32f2f;
        }
        
        .stat-medium {
          color: #f57c00;
        }
        
        .stat-low {
          color: #388e3c;
        }
        
        .stat-delayed {
          color: #d32f2f;
        }
        
        .stat-design {
          color: #0097a7;
        }
        
        .stat-planning {
          color: #8e24aa;
        }
      `;
      document.head.appendChild(statsStyles);
    }
  }

  // Method to setup search filters
  setupSearchFilters() {
    // Implement search functionality for each section
    const searchInputs = this.container.querySelectorAll(".search-input");
    searchInputs.forEach((input) => {
      input.addEventListener("input", (e) => {
        const section = e.target.dataset.section;
        this.filters[section].search = e.target.value.toLowerCase().trim();
        this.applyFilters(section);
      });
    });

    // Business type filter for contractors
    const businessTypeFilter = this.container.querySelector(
      "#business-type-filter"
    );
    if (businessTypeFilter) {
      businessTypeFilter.addEventListener("change", (e) => {
        this.filters.contractors.businessType = e.target.value;
        this.applyFilters("contractors");
      });
    }

    // Rating filter for contractors
    const ratingFilter = this.container.querySelector("#rating-filter");
    if (ratingFilter) {
      ratingFilter.addEventListener("change", (e) => {
        this.filters.contractors.rating = e.target.value;
        this.applyFilters("contractors");
      });
    }
  }

  // Method to update business type filter options
  updateBusinessTypeFilter() {
    const businessTypeFilter = this.container.querySelector(
      "#business-type-filter"
    );
    if (!businessTypeFilter) return;

    // Get unique business types
    const businessTypes = [
      ...new Set(this.contractors.map((c) => c.businessType)),
    ].filter(Boolean);

    // Create options HTML
    const optionsHtml = `
      <option value="all">All Types</option>
      ${businessTypes
        .map((type) => `<option value="${type}">${type}</option>`)
        .join("")}
    `;

    // Update the select element
    businessTypeFilter.innerHTML = optionsHtml;
  }

  // Method to apply filters to a section
  applyFilters(section) {
    switch (section) {
      case "contractors":
        this.applyContractorFilters();
        break;
      case "current-projects":
        this.applyProjectFilters("current");
        break;
      case "future-projects":
        this.applyProjectFilters("future");
        break;
    }
  }

  // Method to apply contractor filters
  applyContractorFilters() {
    const filters = this.filters.contractors;
    let filteredContractors = [...this.contractors];

    // Apply search filter
    if (filters.search) {
      filteredContractors = filteredContractors.filter(
        (contractor) =>
          contractor.companyName.toLowerCase().includes(filters.search) ||
          contractor.businessType.toLowerCase().includes(filters.search) ||
          contractor.location.toLowerCase().includes(filters.search) ||
          contractor.email.toLowerCase().includes(filters.search) ||
          contractor.phone.toLowerCase().includes(filters.search)
      );
    }

    // Apply business type filter
    if (filters.businessType !== "all") {
      filteredContractors = filteredContractors.filter(
        (contractor) => contractor.businessType === filters.businessType
      );
    }

    // Apply rating filter
    if (filters.rating !== "all") {
      const ratingValue = parseInt(filters.rating);
      filteredContractors = filteredContractors.filter(
        (contractor) => contractor.rating === ratingValue
      );
    }

    // Render filtered contractors
    this.renderContractors(filteredContractors);
  }

  // Method to apply project filters
  applyProjectFilters(type) {
    const filters =
      this.filters[type === "current" ? "currentProjects" : "futureProjects"];
    const projects =
      type === "current" ? this.currentProjects : this.futureProjects;
    let filteredProjects = [...projects];

    // Apply search filter
    if (filters.search) {
      filteredProjects = filteredProjects.filter(
        (project) =>
          project.name.toLowerCase().includes(filters.search) ||
          project.location.toLowerCase().includes(filters.search)
      );
    }

    // Apply location filter
    if (filters.location) {
      filteredProjects = filteredProjects.filter((project) =>
        project.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Apply status/priority filter
    if (filters.status !== "all") {
      filteredProjects = filteredProjects.filter(
        (project) => project.status === filters.status
      );
    }

    // Apply date filter
    if (filters.date !== "all") {
      // Implement date filtering logic here
    }

    // Render filtered projects
    this.renderProjects(type, filteredProjects);
  }

  // Helper method to close all modals
  closeModals() {
    this.container.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.remove("active");
    });
  }

  // Method to show contractor modal for adding or editing
  showContractorModal(contractor = null) {
    const modal = this.container.querySelector("#contractor-modal");
    const form = modal.querySelector("#contractor-form");
    const title = modal.querySelector("#contractor-modal-title");

    // Reset the form to clear previous data
    form.reset();

    // Set the title based on whether we're adding or editing
    title.textContent = contractor ? "Edit Contractor" : "Add Contractor";

    // Fill the form with existing data if editing
    if (contractor) {
      form.elements.companyName.value = contractor.companyName || "";
      form.elements.businessType.value = contractor.businessType || "";
      form.elements.location.value = contractor.location || "";
      form.elements.email.value = contractor.email || "";
      form.elements.phone.value = contractor.phone || "";

      // Contact person details if available
      if (contractor.contactPerson) {
        form.elements.contactName.value = contractor.contactPerson.name || "";
        form.elements.position.value = contractor.contactPerson.position || "";
        form.elements.contactPhone.value = contractor.contactPerson.phone || "";
        form.elements.contactEmail.value = contractor.contactPerson.email || "";
      }

      // Set the rating
      const rating = parseInt(contractor.rating) || 0;
      form.elements.rating.value = rating;

      // Update the star icons to match the rating
      modal.querySelectorAll(".rating i").forEach((star, index) => {
        star.className = index < rating ? "fas fa-star" : "far fa-star";
      });

      // Store contractor ID for update
      form.dataset.contractorId = contractor.id;
    } else {
      // Clear any stored ID when adding new contractor
      delete form.dataset.contractorId;

      // Reset rating to 0
      form.elements.rating.value = 0;
      modal.querySelectorAll(".rating i").forEach((star) => {
        star.className = "far fa-star";
      });
    }

    // Show the modal
    modal.classList.add("active");
  }

  // Method to handle contractor form submission
  handleContractorSubmit(e) {
    e.preventDefault();
    const form = e.target;

    // Gather form data
    const contractorData = {
      companyName: form.elements.companyName.value,
      businessType: form.elements.businessType.value,
      location: form.elements.location.value,
      email: form.elements.email.value,
      phone: form.elements.phone.value,
      rating: parseInt(form.elements.rating.value) || 0,
      contactPerson: {
        name: form.elements.contactName.value,
        position: form.elements.position.value,
        phone: form.elements.contactPhone.value,
        email: form.elements.contactEmail.value,
      },
    };

    if (form.dataset.contractorId) {
      // Update existing contractor
      const contractorId = parseInt(form.dataset.contractorId);
      this.updateContractor(contractorId, contractorData);
    } else {
      // Create new contractor
      this.createContractor(contractorData);
    }

    // Close the modal
    this.closeModals();
  }

  updateContractor(contractorId, contractorData) {
    // Implement the logic to update an existing contractor
    // This might involve making an API call to update the contractor data
    console.log("Updating contractor:", contractorId, contractorData);
  }

  createContractor(contractorData) {
    // Implement the logic to create a new contractor
    // This might involve making an API call to create a new contractor
    console.log("Creating new contractor:", contractorData);
  }

  // Method to create a new contractor
  createContractor(data) {
    // First add to local data structure for immediate feedback
    const newContractor = {
      id: Date.now(), // Temporary ID until server responds
      ...data,
      employees: [],
    };

    // Prepare data for API
    const apiData = {
      company_name: data.companyName,
      business_type: data.businessType,
      location: data.location || "",
      email: data.email || "",
      phone: data.phone || "",
      rating: parseInt(data.rating) || 0,
      contact_person: {
        name: data.contactPerson.name || "",
        position: data.contactPerson.position || "",
        phone: data.contactPerson.phone || "",
        email: data.contactPerson.email || "",
        is_primary_contact: 1,
      },
    };

    // Исправленный URL API - напрямую к contractors.php вместо index.php
    fetch(
      "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((responseData) => {
        if (responseData.success) {
          // Refresh the contractors list
          this.loadContractors().then(() => this.renderContractors());
        } else {
          console.error("Error creating contractor:", responseData.message);
          alert("Failed to create contractor: " + responseData.message);
        }
      })
      .catch((error) => {
        console.error("Error creating contractor:", error);
        alert("Failed to create contractor. Please try again.");
      });

    // Add to local array for immediate UI update
    this.contractors.push(newContractor);
    this.renderContractors();
  }

  // Method to update an existing contractor
  updateContractor(contractorId, data) {
    // Find the contractor in the local array
    const index = this.contractors.findIndex((c) => c.id === contractorId);
    if (index === -1) return;

    // Update local data first for immediate feedback
    const updatedContractor = {
      ...this.contractors[index],
      ...data,
    };
    this.contractors[index] = updatedContractor;

    // Prepare data for API
    const apiData = {
      company_name: data.companyName,
      business_type: data.businessType,
      location: data.location || "",
      email: data.email || "",
      phone: data.phone || "",
      rating: parseInt(data.rating) || 0,
      contact_person: {
        name: data.contactPerson.name || "",
        position: data.contactPerson.position || "",
        phone: data.contactPerson.phone || "",
        email: data.contactPerson.email || "",
        is_primary_contact: 1,
      },
    };

    // Исправленный URL API - напрямую к contractors.php вместо index.php
    fetch(
      `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((responseData) => {
        if (responseData.success) {
          // Refresh the contractors list
          this.loadContractors().then(() => this.renderContractors());
        } else {
          console.error("Error updating contractor:", responseData.message);
          alert("Failed to update contractor: " + responseData.message);
        }
      })
      .catch((error) => {
        console.error("Error updating contractor:", error);
        alert("Failed to update contractor. Please try again.");
      });

    // Update the UI immediately for better UX
    this.renderContractors();
  }

  // Method to delete a contractor
  deleteContractor(contractorId) {
    if (!confirm("Are you sure you want to delete this contractor?")) return;

    // Remove from local array first for immediate feedback
    this.contractors = this.contractors.filter((c) => c.id !== contractorId);

    // Исправленный URL API - напрямую к contractors.php вместо index.php
    fetch(
      `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?id=${contractorId}`,
      {
        method: "DELETE",
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((responseData) => {
        if (responseData.success) {
          // Already removed from local array, just re-render
          this.renderContractors();
        } else {
          console.error("Error deleting contractor:", responseData.message);
          alert("Failed to delete contractor: " + responseData.message);

          // Reload contractors to restore the deleted one
          this.loadContractors().then(() => this.renderContractors());
        }
      })
      .catch((error) => {
        console.error("Error deleting contractor:", error);
        alert("Failed to delete contractor. Please try again.");

        // Reload contractors to restore the deleted one
        this.loadContractors().then(() => this.renderContractors());
      });

    // Render immediately for UI feedback
    this.renderContractors();
  }

  // Метод для заполнения списка подрядчиков в выпадающем списке
  populateContractorSelect(select) {
    // Очищаем текущий список
    select.innerHTML = '<option value="">Select Contractor</option>';

    // Заполняем список подрядчиками
    this.contractors.forEach((contractor) => {
      const option = document.createElement("option");
      option.value = contractor.id;
      option.textContent = `${contractor.companyName} (${contractor.businessType})`;
      select.appendChild(option);
    });
  }

  // Метод для обновления списка контактных лиц при выборе подрядчика
  updateContactPersonSelect(contractorId) {
    // Находим активную форму (в модальном окне)
    const activeModal = this.container.querySelector(".modal.active");
    if (!activeModal) return;

    const form = activeModal.querySelector("form");
    if (!form) return;

    const contactPersonSelect = form.elements.contactPersonId;
    if (!contactPersonSelect) return;

    // Очищаем список и делаем его неактивным, если не выбран подрядчик
    contactPersonSelect.innerHTML =
      '<option value="">Select Contact Person</option>';

    if (!contractorId) {
      contactPersonSelect.disabled = true;
      return;
    }

    // Находим выбранного подрядчика
    const contractor = this.contractors.find((c) => c.id == contractorId);
    if (!contractor) {
      contactPersonSelect.disabled = true;
      return;
    }

    // Делаем список активным
    contactPersonSelect.disabled = false;

    // Добавляем основное контактное лицо подрядчика
    if (contractor.contactPerson) {
      const option = document.createElement("option");
      option.value = contractor.contactPerson.id; // Use the contact person's ID instead of contractor ID
      option.textContent = `${contractor.contactPerson.name} (${
        contractor.contactPerson.position || "Primary Contact"
      })`;
      contactPersonSelect.appendChild(option);
    }

    // Добавляем сотрудников подрядчика
    if (contractor.employees && contractor.employees.length > 0) {
      contractor.employees.forEach((employee) => {
        const option = document.createElement("option");
        option.value = employee.id;
        option.textContent = `${employee.name || employee.fullName} (${
          employee.position || "Employee"
        })`;
        contactPersonSelect.appendChild(option);
      });
    }
  }

  // Оставляю только рабочую версию метода loadContractors
  async loadContractors() {
    try {
      const response = await fetch(
        "/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Convert API format to client format
        this.contractors = result.data.map((contractor) => {
          return {
            id: parseInt(contractor.id),
            companyName: contractor.company_name,
            businessType: contractor.business_type,
            location: contractor.location || "",
            email: contractor.email || "",
            phone: contractor.phone || "",
            rating: parseInt(contractor.rating) || 0,
            contactPerson: contractor.contact_person
              ? {
                  id: parseInt(contractor.contact_person.id),
                  name: contractor.contact_person.name,
                  position: contractor.contact_person.position || "",
                  phone: contractor.contact_person.phone || "",
                  email: contractor.contact_person.email || "",
                }
              : {
                  name: "None",
                  position: "",
                  phone: "",
                  email: "",
                },
            employees: contractor.employees
              ? contractor.employees.map((emp) => ({
                  id: parseInt(emp.id),
                  fullName: emp.name,
                  position: emp.position || "",
                  phone: emp.phone || "",
                  email: emp.email || "",
                }))
              : [],
          };
        });
      } else {
        console.error("Failed to load contractors:", result.message);
        // Fallback to empty array
        this.contractors = [];
      }
    } catch (error) {
      console.error("Error loading contractors:", error);
      // Fallback to empty array on error
      this.contractors = [];
    }
  }

  // Оставляю только одну копию метода renderContractors
  renderContractors() {
    const container = this.container.querySelector("#contractors-list");
    if (!container) return;

    if (this.contractors.length === 0) {
      container.innerHTML = `
            <div class="no-contractors">
                <i class="fas fa-building"></i>
                <h3>No Contractors Yet</h3>
                <p>Click the "Add Contractor" button to add your first contractor</p>
            </div>
        `;
      return;
    }

    container.innerHTML = this.contractors
      .map(
        (contractor) => `
      <div class="contractor-card" data-id="${contractor.id}">
        <div class="contractor-header">
          <h3>${contractor.companyName}</h3>
          <div class="contractor-rating">
            ${this.generateRatingStars(contractor.rating)}
          </div>
        </div>
        <div class="contractor-info">
          <div class="info-item">
            <i class="fas fa-briefcase"></i>
            <span>${contractor.businessType}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-location-dot"></i>
            <span>${contractor.location}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.email}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.phone}</span>
          </div>
        </div>
        <div class="contact-person-info">
          <h4>Contact Person</h4>
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span>${contractor.contactPerson.name}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-id-badge"></i>
            <span>${contractor.contactPerson.position}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span>${contractor.contactPerson.phone}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <span>${contractor.contactPerson.email}</span>
          </div>
        </div>
        <div class="contractor-employees">
          <h4>Employees (${contractor.employees.length})</h4>
          <div class="employees-list">
            ${this.renderEmployeesList(contractor.employees)}
          </div>
          <button class="btn-secondary add-employee" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-user-plus"></i> Add Employee
          </button>
        </div>
        <div class="contractor-actions">
          <button class="btn-action edit" data-contractor-id="${contractor.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action delete" data-contractor-id="${
            contractor.id
          }">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    // Добавляем обработчики событий после рендеринга
    this.bindEmployeeEvents();

    // Add event handlers for contractor edit and delete buttons
    this.container
      .querySelectorAll(".contractor-actions .btn-action.edit")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          const contractor = this.contractors.find(
            (c) => c.id === contractorId
          );
          if (contractor) {
            this.showContractorModal(contractor);
          }
        });
      });

    this.container
      .querySelectorAll(".contractor-actions .btn-action.delete")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const contractorId = parseInt(button.dataset.contractorId);
          this.deleteContractor(contractorId);
        });
      });
  }

  // Оставляю только одну копию метода renderEmployeesList
  renderEmployeesList(employees) {
    return employees
      .map(
        (employee) => `
        <div class="employee-item">
            <div class="employee-info">
                <strong>${employee.fullName}</strong>
                <span>${employee.position}</span>
                <span>${employee.phone}</span>
            </div>
            <div class="employee-actions">
                <button class="btn-action edit" data-employee-id="${employee.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" data-employee-id="${employee.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `
      )
      .join("");
  }

  // Оставляю только рабочую версию метода addEmployeeToContractor
  addEmployeeToContractor(contractorId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      // First add to local data structure for immediate feedback
      data.id = Date.now(); // Temporary ID
      contractor.employees.push(data);

      // Prepare data for API
      const existingEmployees = contractor.employees.filter(
        (e) => e.id !== data.id
      );

      const apiData = {
        company_name: contractor.companyName,
        business_type: contractor.businessType,
        location: contractor.location,
        email: contractor.email,
        phone: contractor.phone,
        rating: contractor.rating,
        notes: contractor.notes || "",
        employees: [
          ...existingEmployees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: 0,
          })),
          // Add new employee
          {
            name: data.fullName,
            position: data.position || "",
            phone: data.phone || "",
            email: data.email || "",
            is_primary_contact: 0,
          },
        ],
      };

      // Используем правильный URL API
      fetch(
        `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiData),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((responseData) => {
          if (responseData.success) {
            // Обновляем данные о сотрудниках из ответа API
            if (responseData.data && responseData.data.employees) {
              // Находим контрактор в массиве this.contractors и обновляем его сотрудников
              const updatedContractor = this.contractors.find(
                (c) => c.id === contractorId
              );
              if (updatedContractor) {
                // Преобразуем сотрудников из формата API в формат UI
                updatedContractor.employees = responseData.data.employees.map(
                  (emp) => ({
                    id: parseInt(emp.id),
                    fullName: emp.name,
                    position: emp.position || "",
                    phone: emp.phone || "",
                    email: emp.email || "",
                  })
                );
              }
            }

            // Перерисовываем UI для отображения обновленных данных
            this.renderContractors();
          } else {
            console.error("Error adding employee:", responseData.message);
            alert("Failed to add employee: " + responseData.message);
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          }
        })
        .catch((error) => {
          console.error("Error adding employee:", error);
          alert("Failed to add employee. Please try again.");
          // Обновляем данные с сервера в случае ошибки
          this.loadContractors().then(() => this.renderContractors());
        });

      // Render immediately for responsive UI
      this.renderContractors();
    }
  }

  // Оставляю только рабочую версию метода updateEmployee
  updateEmployee(contractorId, employeeId, data) {
    const contractor = this.contractors.find((c) => c.id === contractorId);
    if (contractor) {
      const index = contractor.employees.findIndex((e) => e.id === employeeId);
      if (index !== -1) {
        // Update local data first
        contractor.employees[index] = {
          ...contractor.employees[index],
          ...data,
        };

        // Prepare data for API
        const apiData = {
          company_name: contractor.companyName,
          business_type: contractor.businessType,
          location: contractor.location,
          email: contractor.email,
          phone: contractor.phone,
          rating: contractor.rating,
          notes: contractor.notes || "",
          employees: contractor.employees.map((e) => ({
            name: e.fullName,
            position: e.position || "",
            phone: e.phone || "",
            email: e.email || "",
            is_primary_contact: e.isPrimaryContact ? 1 : 0,
          })),
        };

        // Используем правильный URL API
        fetch(
          `/Maintenance_P/Inspections-Checklist-Portal/components/construction/api/contractors.php?action=update&id=${contractorId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(apiData),
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
          })
          .then((responseData) => {
            if (responseData.success) {
              // Обновляем данные о сотрудниках из ответа API
              if (responseData.data && responseData.data.employees) {
                // Находим контрактор в массиве this.contractors и обновляем его сотрудников
                const updatedContractor = this.contractors.find(
                  (c) => c.id === contractorId
                );
                if (updatedContractor) {
                  // Преобразуем сотрудников из формата API в формат UI
                  updatedContractor.employees = responseData.data.employees.map(
                    (emp) => ({
                      id: parseInt(emp.id),
                      fullName: emp.name,
                      position: emp.position || "",
                      phone: emp.phone || "",
                      email: emp.email || "",
                    })
                  );
                }
              }

              // Перерисовываем UI для отображения обновленных данных
              this.renderContractors();
            } else {
              console.error("Error updating employee:", responseData.message);
              alert("Failed to update employee: " + responseData.message);
              // Обновляем данные с сервера в случае ошибки
              this.loadContractors().then(() => this.renderContractors());
            }
          })
          .catch((error) => {
            console.error("Error updating employee:", error);
            alert("Failed to update employee. Please try again.");
            // Обновляем данные с сервера в случае ошибки
            this.loadContractors().then(() => this.renderContractors());
          });

        // Render immediately for UI feedback
        this.renderContractors();
      }
    }
  }

  // ... existing code ...
}
