let selectedRow = null;
let fileHandle = null;

// Create row HTML
function tableRowHTML(name, age, product, quantity) {
  return `
    <td>${name}</td>
    <td>${age}</td>
    <td>${product}</td>
    <td>${quantity}</td>
    <td>
      <button class="btn-update" onclick="editItem(this)"><i class="fas fa-edit"></i></button>
      <button class="btn-delete" onclick="deleteItem(this)"><i class="fas fa-trash"></i></button>
    </td>
  `;
}

// Clear form inputs
function clearForm() {
  document.getElementById("name").value = "";
  document.getElementById("age").value = "";
  document.getElementById("product").value = "";
  document.getElementById("quantity").value = "";
  selectedRow = null;
}

// Clear table content
function clearTable() {
  document.querySelector("#inventoryTable tbody").innerHTML = "";
}

// Add or update student entry
function addItem() {
  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;
  const product = document.getElementById("product").value;
  const quantity = document.getElementById("quantity").value;

  if (!name || !age || !product || !quantity) {
    alert("Please fill all fields!");
    return;
  }

  if (selectedRow) {
    selectedRow.innerHTML = tableRowHTML(name, age, product, quantity);
    selectedRow = null;
  } else {
    const row = document.createElement("tr");
    row.innerHTML = tableRowHTML(name, age, product, quantity);
    document.querySelector("#inventoryTable tbody").appendChild(row);
  }

  clearForm();
}

// Edit existing row
function editItem(btn) {
  selectedRow = btn.parentElement.parentElement;
  document.getElementById("name").value = selectedRow.children[0].innerText;
  document.getElementById("age").value = selectedRow.children[1].innerText;
  document.getElementById("product").value = selectedRow.children[2].innerText;
  document.getElementById("quantity").value = selectedRow.children[3].innerText;
}

// Delete row
function deleteItem(btn) {
  if (confirm("Are you sure to delete this record?")) {
    btn.parentElement.parentElement.remove();
  }
}

// Open Excel file and load data
async function openExcelFile() {
  try {
    [fileHandle] = await window.showOpenFilePicker({
      types: [{
        description: "Excel Files",
        accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
      }],
      excludeAcceptAllOption: true,
      multiple: false,
    });

    const file = await fileHandle.getFile();
    const arrayBuffer = await file.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    clearTable();
    data.forEach((row) => {
      const name = row.Name || "";
      const age = row.Age || "";
      const product = row.Product || "";
      const quantity = row.Quantity || "";
      const tr = document.createElement("tr");
      tr.innerHTML = tableRowHTML(name, age, product, quantity);
      document.querySelector("#inventoryTable tbody").appendChild(tr);
    });

    alert("Excel file loaded.");
  } catch (error) {
    console.error(error);
    alert("Failed to open Excel file.");
  }
}

// Save current table back to the same Excel file
async function saveCurrentExcel() {
  if (!fileHandle) {
    alert("No Excel file opened.");
    return;
  }

  const rows = document.querySelectorAll("#inventoryTable tbody tr");
  const data = Array.from(rows).map((row) => ({
    Name: row.children[0].innerText,
    Age: row.children[1].innerText,
    Product: row.children[2].innerText,
    Quantity: row.children[3].innerText,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  const writable = await fileHandle.createWritable();
  await writable.write(buffer);
  await writable.close();

  alert("Changes saved to Excel file.");
}
async function createNewExcel() {
  if (!window.showSaveFilePicker) {
    alert("Your browser doesn't support File System Access API. Please use Chrome or Edge over HTTPS or localhost.");
    return;
  }

  try {
    const fileHandleOptions = {
      suggestedName: "NewInventory.xlsx",
      types: [{
        description: "Excel Files",
        accept: {
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
        }
      }]
    };

    fileHandle = await window.showSaveFilePicker(fileHandleOptions);

    const initialData = [
      { Name: "", Age: "", Product: "", Quantity: "" }
    ];

    const ws = XLSX.utils.json_to_sheet(initialData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    const writable = await fileHandle.createWritable();
    await writable.write(buffer);
    await writable.close();

    // Optional: If function is defined
    // await openExcelWithWriteAccess();  <-- Only use this if function is defined above

    alert("✅ New Excel file created.");
  } catch (error) {
    if (error.name === 'AbortError') {
      alert("❌ File creation canceled by the user.");
    } else {
      console.error("❌ Failed to create new Excel file:", error);
      alert("Failed to create or save the file. Check console for details.");
    }
  }
}
