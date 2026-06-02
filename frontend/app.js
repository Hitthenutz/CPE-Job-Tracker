const API_URL = "/api/applications";

const options = {
  type: ["Internship", "Co-op", "New Grad", "Part-time", "Research"],
  priority: ["High", "Medium", "Low"],
  status: ["Not Started", "Applied", "OA", "Phone Screen", "Interview", "Final Round", "Offer", "Rejected", "Withdrawn", "Ghosted", "Accepted"],
  mode: ["Office", "On-site", "Hybrid", "Remote", "Flexible", "Unknown"],
  referral: ["Yes", "No", "Needed"],
};

let applications = [];

const els = {
  applicationsBody: document.querySelector("#applicationsBody"),
  contactsGrid: document.querySelector("#contactsGrid"),
  navItems: document.querySelectorAll(".nav-item"),
  viewPanels: document.querySelectorAll("[data-view-panel]"),
  viewEyebrow: document.querySelector("#viewEyebrow"),
  viewTitle: document.querySelector("#viewTitle"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  priorityFilter: document.querySelector("#priorityFilter"),
  modeFilter: document.querySelector("#modeFilter"),
  form: document.querySelector("#applicationForm"),
  formTitle: document.querySelector("#formTitle"),
  applicationDialog: document.querySelector("#applicationDialog"),
  closeDialogBtn: document.querySelector("#closeDialogBtn"),
  cancelDialogBtn: document.querySelector("#cancelDialogBtn"),
  newApplicationBtn: document.querySelector("#newApplicationBtn"),
  submitOpportunityBtn: document.querySelector("#submitOpportunityBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importFile: document.querySelector("#importFile"),
  toast: document.querySelector("#toast"),
  totalCount: document.querySelector("#totalCount"),
  activeCount: document.querySelector("#activeCount"),
  interviewCount: document.querySelector("#interviewCount"),
  offerCount: document.querySelector("#offerCount"),
  dueSoonCount: document.querySelector("#dueSoonCount"),
  nextFollowUp: document.querySelector("#nextFollowUp"),
};

const fields = [
  "applicationId", "company", "role", "type", "priority", "status", "dateApplied",
  "deadline", "location", "mode", "link", "contact", "referral", "nextStep",
  "followUpDate", "compensation", "notes",
].reduce((acc, id) => {
  acc[id] = document.querySelector(`#${id}`);
  return acc;
}, {});

async function loadApplications() {
  setTableMessage("Loading pipeline...");
  applications = await requestJson(API_URL);
  render();
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function fillOptions(select, values, includeAll = false) {
  select.innerHTML = "";
  if (includeAll) {
    select.append(new Option("All", "All"));
  }
  values.forEach((value) => select.append(new Option(value, value)));
}

function setupOptions() {
  fillOptions(fields.type, options.type);
  fillOptions(fields.priority, options.priority);
  fillOptions(fields.status, options.status);
  fillOptions(fields.mode, options.mode);
  fillOptions(fields.referral, options.referral);
  fillOptions(els.statusFilter, options.status, true);
  fillOptions(els.priorityFilter, options.priority, true);
  fillOptions(els.modeFilter, options.mode, true);
}

function getFilteredApplications() {
  const search = els.searchInput.value.trim().toLowerCase();
  const status = els.statusFilter.value;
  const priority = els.priorityFilter.value;
  const mode = els.modeFilter.value;

  return applications.filter((app) => {
    const haystack = [app.company, app.role, app.location, app.notes, app.nextStep]
      .join(" ")
      .toLowerCase();
    return (!search || haystack.includes(search))
      && (status === "All" || app.status === status)
      && (priority === "All" || app.priority === priority)
      && (mode === "All" || app.mode === mode);
  });
}

function renderApplications() {
  const visible = getFilteredApplications();

  if (!visible.length) {
    setTableMessage("No opportunities match this view.");
    return;
  }

  els.applicationsBody.innerHTML = visible.map((app) => `
    <tr>
      <td class="company-cell">
        <strong>${escapeHtml(app.company)}</strong>
        <span>${escapeHtml(app.location || "No location")}</span>
      </td>
      <td class="role-cell">
        <strong>${escapeHtml(app.role)}</strong>
        <span>${escapeHtml(app.type || "Opportunity")}</span>
      </td>
      <td><span class="pill status-${statusClass(app.status)}">${escapeHtml(app.status)}</span></td>
      <td><span class="pill priority-${escapeHtml(app.priority)}">${escapeHtml(app.priority)}</span></td>
      <td><span class="pill mode">${escapeHtml(app.mode)}</span></td>
      <td>${formatDate(app.dateApplied)}</td>
      <td>${formatDate(app.followUpDate)}</td>
      <td>${escapeHtml(app.nextStep || "Add next step")}</td>
      <td>
        <div class="row-actions">
          ${app.link ? `<button class="small-button" type="button" data-open="${app.id}">Open</button>` : ""}
          <button class="small-button" type="button" data-edit="${app.id}">Edit</button>
          <button class="small-button" type="button" data-delete="${app.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function setTableMessage(message) {
  els.applicationsBody.innerHTML = `<tr><td colspan="9" class="empty-state">${escapeHtml(message)}</td></tr>`;
}

function renderMetrics() {
  const activeStatuses = new Set(["Not Started", "Applied", "OA", "Phone Screen", "Interview", "Final Round"]);
  const now = startOfDay(new Date());
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 7);

  const dueSoon = applications.filter((app) => {
    if (!app.followUpDate || app.status === "Rejected" || app.status === "Accepted") return false;
    const followUp = parseDate(app.followUpDate);
    return followUp >= now && followUp <= soon;
  });

  els.totalCount.textContent = applications.length;
  els.activeCount.textContent = applications.filter((app) => activeStatuses.has(app.status)).length;
  els.interviewCount.textContent = applications.filter((app) => ["Interview", "Final Round"].includes(app.status)).length;
  els.offerCount.textContent = applications.filter((app) => ["Offer", "Accepted"].includes(app.status)).length;
  els.dueSoonCount.textContent = dueSoon.length;

  dueSoon.sort((a, b) => parseDate(a.followUpDate) - parseDate(b.followUpDate));
  els.nextFollowUp.textContent = dueSoon[0]
    ? `${dueSoon[0].company} on ${formatDate(dueSoon[0].followUpDate)}`
    : "None due";
}

function render() {
  renderMetrics();
  renderApplications();
  renderContacts();
}

function clearForm() {
  els.form.reset();
  fields.applicationId.value = "";
  fields.type.value = "Internship";
  fields.priority.value = "Medium";
  fields.status.value = "Not Started";
  fields.mode.value = "Hybrid";
  fields.referral.value = "No";
  els.formTitle.textContent = "Add opportunity";
  els.submitOpportunityBtn.textContent = "Confirm & Save";
}

function openNewOpportunityDialog() {
  clearForm();
  els.applicationDialog.showModal();
  fields.company.focus();
}

function closeOpportunityDialog() {
  els.applicationDialog.close();
}

function editApplication(id) {
  const app = applications.find((item) => item.id === id);
  if (!app) return;

  fields.applicationId.value = app.id;
  fields.company.value = app.company || "";
  fields.role.value = app.role || "";
  fields.type.value = app.type || "Internship";
  fields.priority.value = app.priority || "Medium";
  fields.status.value = app.status || "Not Started";
  fields.dateApplied.value = app.dateApplied || "";
  fields.deadline.value = app.deadline || "";
  fields.location.value = app.location || "";
  fields.mode.value = app.mode || "Hybrid";
  fields.link.value = app.link || "";
  fields.contact.value = app.contact || "";
  fields.referral.value = app.referral || "No";
  fields.nextStep.value = app.nextStep || "";
  fields.followUpDate.value = app.followUpDate || "";
  fields.compensation.value = app.compensation || "";
  fields.notes.value = app.notes || "";
  els.formTitle.textContent = "Edit opportunity";
  els.submitOpportunityBtn.textContent = "Confirm Update";
  els.applicationDialog.showModal();
  fields.company.focus();
}

async function handleSubmit(event) {
  event.preventDefault();
  const id = fields.applicationId.value;
  const next = formPayload();
  const url = id ? `${API_URL}/${encodeURIComponent(id)}` : API_URL;
  const method = id ? "PUT" : "POST";

  try {
    els.submitOpportunityBtn.disabled = true;
    els.submitOpportunityBtn.textContent = id ? "Updating..." : "Posting...";
    await requestJson(url, {
      method,
      body: JSON.stringify(next),
    });
    clearForm();
    closeOpportunityDialog();
    await loadApplications();
    showToast(id ? "Opportunity updated." : "Opportunity posted to pipeline.");
  } catch (error) {
    alert(error.message);
  } finally {
    els.submitOpportunityBtn.disabled = false;
    els.submitOpportunityBtn.textContent = fields.applicationId.value ? "Confirm Update" : "Confirm & Save";
  }
}

function formPayload() {
  return {
    company: fields.company.value.trim(),
    role: fields.role.value.trim(),
    type: fields.type.value,
    priority: fields.priority.value,
    status: fields.status.value,
    dateApplied: fields.dateApplied.value,
    deadline: fields.deadline.value,
    location: fields.location.value.trim(),
    mode: fields.mode.value,
    link: fields.link.value.trim(),
    contact: fields.contact.value.trim(),
    referral: fields.referral.value,
    nextStep: fields.nextStep.value.trim(),
    followUpDate: fields.followUpDate.value,
    compensation: fields.compensation.value.trim(),
    notes: fields.notes.value.trim(),
  };
}

function exportData() {
  const blob = new Blob([JSON.stringify(applications, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "devpipeline-export.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error("Expected an array");
      for (const app of parsed) {
        await requestJson(API_URL, {
          method: "POST",
          body: JSON.stringify(app),
        });
      }
      clearForm();
      await loadApplications();
    } catch {
      alert("That file does not look like tracker JSON.");
    }
  };
  reader.readAsText(file);
}

async function handleTableClick(event) {
  const button = event.target.closest("button");
  if (!button) return;

  const editId = button.dataset.edit;
  const deleteId = button.dataset.delete;
  const openId = button.dataset.open;

  if (editId) editApplication(editId);
  if (deleteId) {
    await requestJson(`${API_URL}/${encodeURIComponent(deleteId)}`, { method: "DELETE" });
    await loadApplications();
    showToast("Opportunity deleted.");
  }
  if (openId) {
    const app = applications.find((item) => item.id === openId);
    if (app?.link) window.open(app.link, "_blank", "noopener");
  }
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    els.toast.classList.remove("visible");
  }, 2400);
}

function renderContacts() {
  const contacts = applications
    .filter((app) => app.contact)
    .map((app) => ({
      name: app.contact,
      company: app.company,
      role: app.role,
      status: app.status,
      referral: app.referral,
      followUpDate: app.followUpDate,
      nextStep: app.nextStep,
    }));

  if (!contacts.length) {
    els.contactsGrid.innerHTML = `
      <div class="empty-state">
        Add a contact inside an opportunity, then it will appear here.
      </div>
    `;
    return;
  }

  els.contactsGrid.innerHTML = contacts.map((contact) => `
    <article class="contact-card">
      <strong>${escapeHtml(contact.name)}</strong>
      <span>${escapeHtml(contact.company)} · ${escapeHtml(contact.role)}</span>
      <div class="contact-meta">
        <span class="pill status-${statusClass(contact.status)}">${escapeHtml(contact.status)}</span>
        <span class="pill mode">Referral: ${escapeHtml(contact.referral)}</span>
      </div>
      <p>${escapeHtml(contact.nextStep || "No next step saved.")}</p>
      <p>Follow-up: ${formatDate(contact.followUpDate)}</p>
    </article>
  `).join("");
}

function switchView(view) {
  els.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });

  els.viewPanels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.viewPanel !== view);
  });

  if (view === "contacts") {
    els.viewEyebrow.textContent = "Recruiter and referral relationship map";
    els.viewTitle.textContent = "Contacts";
    els.newApplicationBtn.classList.add("hidden");
  } else {
    els.viewEyebrow.textContent = "Software engineering opportunity pipeline";
    els.viewTitle.textContent = "Pipeline";
    els.newApplicationBtn.classList.remove("hidden");
  }
}

function statusClass(status) {
  return String(status).split(" ")[0] || "Not";
}

function formatDate(value) {
  if (!value) return "-";
  const date = parseDate(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

setupOptions();
clearForm();
loadApplications().catch((error) => {
  setTableMessage(`Could not load pipeline: ${error.message}`);
});

els.searchInput.addEventListener("input", renderApplications);
els.statusFilter.addEventListener("change", renderApplications);
els.priorityFilter.addEventListener("change", renderApplications);
els.modeFilter.addEventListener("change", renderApplications);
els.form.addEventListener("submit", handleSubmit);
els.closeDialogBtn.addEventListener("click", closeOpportunityDialog);
els.cancelDialogBtn.addEventListener("click", closeOpportunityDialog);
els.newApplicationBtn.addEventListener("click", openNewOpportunityDialog);
els.applicationsBody.addEventListener("click", handleTableClick);
els.exportBtn.addEventListener("click", exportData);
els.importFile.addEventListener("change", (event) => importData(event.target.files[0]));
els.navItems.forEach((item) => {
  item.addEventListener("click", () => switchView(item.dataset.view));
});
