import {
    keysTablePrincipal,
    tablaPrincipalHTML,
    showLoadingOverlay,
    hideLoadingOverlay,
    showRowTablePrincipal,
    styleRowTablePrincipal,
    user_code,
    showToastSwetAlert,
    delay,
    viewInfoHTML,
    keysSummary,
    showModalConfirm,
} from './constants.js'
import { getLOTES, putStateLote, jsonToExcel, reloadRecords, printTAGS,printTAGSText , printTAGSLocal, getDataToExport} from './service.js';
const app = document.querySelector('#view-principal');

const recordsPerPage = 5;
let totalRecords = 100;
let currentPage = 1;
let totalPages = 0;

let filtro = [];

// Suscripción
const subscriptionReloardRecords = reloadRecords.subscribe((value) => {
    if(value && value ==='reload'){
        fetchData(currentPage,recordsPerPage);
    }
});

const  addFilter = (key, operator, value) =>{
    const encontrado = filtro.filter(filtro => filtro.key === key);
    if (encontrado.length === 0) {
        filtro.push({ key, operator, value })
    } else {
        encontrado[0].value = value;
        encontrado[0].operator = operator;
    }
};

//armamos la tabla
app.innerHTML = tablaPrincipalHTML;

const tableBody = document.querySelector('#table-body');

//Lógica para ver el resumen de una cabecera

const viewInfo = document.getElementById('view-info');

viewInfo.innerHTML = viewInfoHTML;

const cabeceraInfoId = document.getElementById('cabecera-info-id');

const bodyInfoTable= document.getElementById('body-info-table');

const btnBackInfo= document.getElementById('btn-back-info');

btnBackInfo.addEventListener('click', async () => {
    showLoadingOverlay();
    await delay(500);
    hideLoadingOverlay();
    viewInfo.hidden = true;
    app.hidden = false;
});

const setInfoTable = (data) => {
    cabeceraInfoId.textContent = data.id_registro;
    bodyInfoTable.innerHTML = data.items.map(item => `
        <tr>
        ${keysSummary.map(key => `<td>${item[key] ?? ''}</td>`).join('')}
        </tr>
    `).join('');
}


const buttonInfoWithEvent = (data,parentElement) => {
    const button = document.createElement('button');
    button.className = 'btn btn-dark btn-sm d-flex justify-content-center align-items-center';
    button.title = 'Ver detalles';
    button.innerHTML = `<span class="material-symbols-outlined">info</span>`;
    button.addEventListener('click', () => handleButtonClickInfo(data));
    parentElement.appendChild(button); // Agregar el botón al DOM
}

const buttonConfirmWithEvent = (data, parentElement) => {
    if (data.estado && data.estado === 'PENDIENTE') {
        const button = document.createElement('button');
        button.className = 'btn btn-success btn-sm d-flex justify-content-center align-items-center';
        button.title = 'Confirmar';
        button.innerHTML = `<span class="material-symbols-outlined">done</span>`;
        button.addEventListener('click', () => handleButtonClickConfirm(data));
        parentElement.appendChild(button); // Agregar el botón al DOM
    }
}

const buttonCancelWithEvent = (data, parentElement) => {
    if (data.estado && data.estado === 'PENDIENTE') {
        const button = document.createElement('button');
        button.className = 'btn btn-danger btn-sm d-flex justify-content-center align-items-center';
        button.title = 'Cancelar';
        button.innerHTML = `<span class="material-symbols-outlined">cancel</span>`;
        button.addEventListener('click', () => handleButtonClickCancel(data));
        parentElement.appendChild(button); // Agregar el botón al DOM
    }
}

const buttonPrintTagsWithEvent = (data, parentElement) => {
    if(data.estado && data.estado === 'APROBADO'){
        const button = document.createElement('button');
        button.className = 'btn btn-dark btn-sm d-flex justify-content-center align-items-center';
        button.title = 'Imprimir etiquetas';
        button.innerHTML = `<span class="material-symbols-outlined">print</span>`;
        button.addEventListener('click', () => handleButtonClickPrintTags(data));
        parentElement.appendChild(button); // Agregar el botón al DOM
    }
}
const buttonPrintTagsLocalWithEvent = (data, parentElement) => {
    if(data.estado && data.estado === 'APROBADO'){
        const button = document.createElement('button');
        button.className = 'btn btn-success btn-sm d-flex justify-content-center align-items-center';
        button.title = 'Imprimir etiquetas localmente';
        button.innerHTML = `<span class="material-symbols-outlined">print</span>`;
        button.addEventListener('click', () => handleButtonClickPrintTagsLocal(data));
        parentElement.appendChild(button); // Agregar el botón al DOM
    }
}

const buttonExportExcelWithEvent = (data, parentElement) => {
    if(data.estado && data.estado === 'APROBADO'){
        const button = document.createElement('button');
        button.className = 'btn btn-dark btn-sm d-flex justify-content-center align-items-center';
        button.title = 'Exportar a Excel';
        button.innerHTML = `<span class="material-symbols-outlined">table_chart</span>`;
        button.addEventListener('click', () => handleButtonClickExportExcel(data));
        parentElement.appendChild(button); // Agregar el botón al DOM
    }
}

const handleButtonClickInfo =  (data) => {
    // Implementa la lógica necesaria
    infoRecord(data);
};

const handleButtonClickConfirm = async (data) => {
    //mandamos un alert para confirmar la acción
    const confirm = await showModalConfirm('¿Estás seguro de confirmar el registro?', 'warning');
    if (!confirm) return;
    await confirmRecord(data.id_registro);
}

const handleButtonClickCancel = async (data) => {
    //mandamos un alert para confirmar la acción
    const confirm = await showModalConfirm('¿Estás seguro de anular el registro?', 'warning');
    if (!confirm) return;
    // Implementa la lógica necesaria
    await deleteRecord(data.id_registro);
}

const handleButtonClickPrintTags = async (data) => {
    //mandamos un alert para confirmar la acción
    const confirm = await showModalConfirm('¿Estás seguro de imprimir las etiquetas?', 'warning');
    if (!confirm) return;
    // Implementa la lógica necesaria
    await printTags(data);
}

const handleButtonClickPrintTagsLocal = async (data) => {
    //mandamos un alert para confirmar la acción
    const confirm = await showModalConfirm('¿Estás seguro de imprimir las etiquetas localmente?', 'warning');
    if (!confirm) return;
    // Implementa la lógica necesaria
    await printTagsLocal(data);
}

const handleButtonClickExportExcel = async (data) => {
    await exportExcel(data.id_registro);
}

export const actionsTablePrincipal = {
    info: (row, parentElement) => {
        buttonInfoWithEvent(row, parentElement); // Crear botón y añadirlo al DOM
    },
    confirm: (row, parentElement) => {
        buttonConfirmWithEvent(row, parentElement); // Crear botón y añadirlo al DOM
    },
    cancel: (row, parentElement) => {
        buttonCancelWithEvent(row, parentElement); // Crear botón y añadirlo al DOM
    },
    print: (row, parentElement) => {
        buttonPrintTagsWithEvent(row, parentElement); // Crear botón y añadirlo al DOM
    },
    printLocal: (row, parentElement) => {
        buttonPrintTagsLocalWithEvent(row, parentElement); // Crear botón y añadirlo al DOM
    }
    ,
    export: (row, parentElement) => {
        buttonExportExcelWithEvent(row, parentElement); // Crear botón y añadirlo al DOM
    }
}

export const keysActionsTablePrincipal = Object.keys(actionsTablePrincipal);

const renderTable = (data) => {
    tableBody.innerHTML = ''; // Limpiar el contenido previo

    data.forEach(row => {
        const tr = document.createElement('tr');

        keysTablePrincipal.forEach(key => {
            const td = document.createElement('td');

            if (key !== 'acciones') {
                // Para las columnas que no son "acciones"
                const div = document.createElement('div');
                div.className = styleRowTablePrincipal[key](row[key]);
                div.innerText = showRowTablePrincipal[key](row[key]);
                td.appendChild(div);
            } else {
                // Para la columna de "acciones"
                const div = document.createElement('div');
                div.className = 'grid-buttons';

                // Crear y añadir los botones de acción
                keysActionsTablePrincipal.forEach(action => {
                    actionsTablePrincipal[action](row, div); // Pasar el div como contenedor
                });

                td.appendChild(div);
            }

            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
};

const firstPageBtn = document.getElementById('firstPageBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const lastPageBtn = document.getElementById('lastPageBtn');
const currentPageBtn = document.getElementById('currentPage');

const updatePaginationButtons = () => {
    firstPageBtn.classList.toggle('disabled', currentPage === 1);
    prevPageBtn.classList.toggle('disabled', currentPage === 1);
    nextPageBtn.classList.toggle('disabled', currentPage === totalPages || totalPages == 0);
    lastPageBtn.classList.toggle('disabled', currentPage === totalPages || totalPages == 0);
    currentPageBtn.classList.toggle('disabled', totalPages === 0);
    currentPageBtn.querySelector('.page-link').innerText = 'Página ' + currentPage + ' de ' + totalPages;
}

const handllePaginationClick = async (event) => {
    showLoadingOverlay();
    event.preventDefault();
    if (event.target.classList.contains('disabled')) return hideLoadingOverlay();;
    const action = event.target.parentElement.id;
    switch (action) {
        case 'firstPageBtn':
            currentPage = 1;
            break;
        case 'prevPageBtn':
            currentPage -= 1;
            break;
        case 'nextPageBtn':
            currentPage += 1;
            break;
        case 'lastPageBtn':
            currentPage = totalPages;
            break;
    }
    updatePaginationButtons();
    // consumimmos la api
    const {data, meta} = await getLOTES(currentPage,recordsPerPage,filtro);
    setMetaData(meta);
    renderTable(data);
    hideLoadingOverlay();
}

const addListenersPage = () => {
    firstPageBtn.addEventListener('click', handllePaginationClick);
    prevPageBtn.addEventListener('click', handllePaginationClick);
    nextPageBtn.addEventListener('click', handllePaginationClick);
    lastPageBtn.addEventListener('click', handllePaginationClick);
}

const initData = async () => {
    //obtenemos el código del usuario
    const user_code_value = user_code.value;
    addFilter('persona_ins','eq',user_code_value);
    showLoadingOverlay();
    await fetchData(currentPage,recordsPerPage);
    hideLoadingOverlay();
    addListenersPage();
    updatePaginationButtons();
}

const fetchData = async (page,limit) => {
    try {
        const {data, meta} = await getLOTES(page,limit,filtro);
        if(!data || data.length === 0){
            showToastSwetAlert('No se encontraron datos', 'warning');
            return;
        }
        renderTable(data);
        setMetaData(meta);
    } catch (error) {
        showToastSwetAlert(`Error al obtener los datos: ${error}`, 'error');
    }
};

const setMetaData = (meta) => {
    totalRecords = meta.total;
    currentPage = meta.page;
    totalPages = Math.ceil(totalRecords / recordsPerPage); 
    updatePaginationButtons();
}

const confirmRecord = async (id) => {
    try {
        showLoadingOverlay();
        await putStateLote(id, 'APROBADO');
        hideLoadingOverlay();
        showToastSwetAlert('Lote confirmado correctamente', 'success');
        fetchData(currentPage,recordsPerPage);
    } catch (error) {
        hideLoadingOverlay();
        showToastSwetAlert(`Error al confirmar el lote: ${error}`, 'error', 5000);
    }
}
const deleteRecord = async (id) => {
    try {
        showLoadingOverlay();
        await putStateLote(id, 'CANCELADO');
        hideLoadingOverlay();
        showToastSwetAlert('Lote anulado correctamente', 'success');
        fetchData(currentPage,recordsPerPage);
    } catch (error) {
        hideLoadingOverlay();
        showToastSwetAlert(`Error al anular el lote: ${error}`, 'error', 5000);
    }
}
const infoRecord = async (data) => {
    showLoadingOverlay();
    await delay(500);
    hideLoadingOverlay();
    setInfoTable(data);
    app.hidden = true;
    viewInfo.hidden = false;
}
const printTags = async (data) => {
    try {
        showLoadingOverlay();
        await printTAGS(data.id);
        hideLoadingOverlay();
        showToastSwetAlert('Etiquetas impresas correctamente', 'success');
    } catch (error) {
        showToastSwetAlert(`Error al imprimir las etiquetas: ${error}`, 'error', 5000);
    }
}

const printTagsLocal = async (data) => {
    try {
        showLoadingOverlay();
        const response = await printTAGSText(data.id);
        await printTAGSLocal(response.text);
        hideLoadingOverlay();
        showToastSwetAlert('Etiquetas impresas localmente', 'success');
    } catch (error) {
        showToastSwetAlert(`Error al imprimir las etiquetas: ${error}`, 'error', 5000);
    }
}

const exportExcel = async (id) => {
    try {
        const response = await getDataToExport(id);
        const nowString = new Date().toISOString().replace(/:/g, '-');
        const filename = `lote-${id}-${nowString}.xlsx`;
        jsonToExcel(response, filename);
    } catch (error) {
        showToastSwetAlert(`Error al exportar a Excel: ${error}`, 'error', 5000);
    }
}

const viewForm = document.querySelector('#view-form');

const btnAdd = document.getElementById('btn-add');

const showForm = async () => {
    showLoadingOverlay();
    await delay(500);
    hideLoadingOverlay();
    app.hidden = true;
    viewForm.hidden = false;
}

btnAdd.addEventListener('click', showForm);

viewInfo.hidden = true;


initData()
