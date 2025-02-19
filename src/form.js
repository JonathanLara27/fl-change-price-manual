import {
    getSKU,
    postLOTE,
    reloadRecords,
} from './service.js';
import {
    cardForm,
    showToastSwetAlert,
    btns,
    validateDescuento,
    validatePrecioFinal,
    validateSku,
    validateSkuWithCU,
    validateStock,
    validateStockResponse,
    messageErrorDescuento,
    messageErrorPrecio,
    calculatePrecioFinal,
    enumTitlesSummaryTable,
    user_code,
    delay,
    showLoadingOverlay,
    hideLoadingOverlay,
    keysSummary,
    showModalConfirm,
} from './constants.js';

// Variables globales
let scannedSkus = []; // sku, tienda, precio_oferta
let responseSkus = [];
let bodyGlobal = {};

// Inicialización de la aplicación
const app = document.getElementById('view-form');
app.innerHTML = cardForm;

// Elementos del formulario
const tipoValor = document.getElementById('tipoValor');
const valor = document.getElementById('valor');
const labelValor = document.getElementById('labelValor');
const errorValor = document.getElementById('error-valor');
const sku = document.getElementById('sku');

// Eventos
const updateValorPlaceholder = (e) => {
    const isMontoFinal = e.target.value === 'monto_final';
    valor.value = '';
    valor.placeholder = isMontoFinal ? 'Precio final' : ' % Descuento';
    labelValor.textContent = isMontoFinal ? 'Precio final' : ' % Descuento';
    valor.setAttribute('max', isMontoFinal ? '' : '100');
};

tipoValor.addEventListener('change', updateValorPlaceholder);

const validateValorInput = (e) => {
    errorValor.textContent = '';

    const isMontoFinal = tipoValor.value === 'monto_final';
    const isValid = isMontoFinal
        ? validatePrecioFinal(e.target.value)
        : validateDescuento(e.target.value);

    if (!isValid) {
        errorValor.textContent = isMontoFinal
            ? messageErrorPrecio
            : messageErrorDescuento;
    }

    sku.disabled = !isValid;
};

valor.addEventListener('keyup', validateValorInput);
// Referencias al DOM
const skusList = document.getElementById('skusList');
const containerTable = document.querySelector('.table-responsive');
const tienda = document.getElementById('tienda');
const inputSku = document.getElementById('sku');

// Estado inicial
containerTable.hidden = true;

// Funciones auxiliares
const addListSku = (sku, index) => {
    const li = document.createElement('li');
    const btnDelete = document.createElement('button');
    btnDelete.setAttribute('att-index', index);
    btnDelete.classList.add('btn', 'btn-dark', 'btn-sm', 'ms-2');
    const iconDelete = document.createElement('span');
    iconDelete.classList.add('material-symbols-outlined');
    iconDelete.textContent = 'delete';
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
    const spanTextSku = document.createElement('span');
    spanTextSku.textContent = `${sku.sku} | ${sku.almacen} | ${sku.precio_oferta}`;
    li.appendChild(spanTextSku);
    btnDelete.appendChild(iconDelete);
    li.appendChild(btnDelete);
    btnDelete.addEventListener('click', () => {
        const indexButton = btnDelete.getAttribute('att-index');
        deleteSku(indexButton);
    });
    // Insertar al comienzo de la lista
    skusList.insertBefore(li, skusList.firstChild);
    //buscamos el index del sku en skusList
};

const refreshListSku = () => {
    const copy = [...scannedSkus]
    //borramos la lista
    skusList.innerHTML = '';
    // se debe poner el indice pero al reves.
    const length = copy.length;
    copy.forEach((sku,index) => {
        addListSku(sku, index);
    });
}

const handleSkuStock = (skuCopy) => {
    const index = responseSkus.findIndex(
        skuResponse => skuResponse.sku === skuCopy.sku &&
            skuResponse.almacen === skuCopy.almacen &&
            skuResponse.precio_oferta === skuCopy.precio_oferta
    );
    responseSkus[index] = skuCopy;
};

const validateFinalPrice = (precio_oferta, precio_etiqueta) => {
    return precio_oferta < precio_etiqueta
}

const deleteSku = (index) => {
    showLoadingOverlay();
    const skuToDelete = {...scannedSkus[index]};
    if(!skuToDelete) return hideLoadingOverlay();
    const matchingSkus = responseSkus.filter(
        responseSKU => responseSKU.sku === skuToDelete.sku && responseSKU.almacen === skuToDelete.almacen
    );
    const matchingSkuWithPrice = findMatchingSkuWithPrice(matchingSkus, skuToDelete.precio_oferta);
    if (!matchingSkuWithPrice) return hideLoadingOverlay();
    //verificamos si la cantidad es mayor a 1
    if (matchingSkuWithPrice.cantidad > 1) {
        const skuCopy = { ...matchingSkuWithPrice };
        skuCopy.cantidad -= 1;
        handleSkuStock(skuCopy);
    } else {
        // eliminamos el sku de scanned skus que tenga el mismo sku, almacen y precio_oferta
        const index = responseSkus.findIndex(
            skuResponse => skuResponse.sku === skuToDelete.sku &&
                skuResponse.almacen === skuToDelete.almacen &&
                skuResponse.precio_oferta === skuToDelete.precio_oferta
        );
        responseSkus.splice(index, 1);
    }
    // eliminamos el elemento con indice index
    scannedSkus.splice(index, 1);
    summaryTableConstruction();
    //falta actualizar tabla de scannedSkus
    refreshListSku();
    hideLoadingOverlay();
    // try {
    // } catch (error) {
    //     showToastSwetAlert(`Error inesperado: ${error}`, 'warning');
    // }
}

const addSkuExist = (sku, matchingSkuWithPrice, matchingSkus) => {

    const accumulated_quantity = matchingSkus.reduce((acc, sku) => acc + sku.cantidad, 0);

    if (matchingSkuWithPrice) {
        const skuCopy = { ...matchingSkuWithPrice };
        const cantidad_temporal = skuCopy.cantidad + 1;
        if (validateStock(accumulated_quantity, skuCopy.stock)) {
            skuCopy.cantidad = cantidad_temporal;
            handleSkuStock(skuCopy);
            const newScannedSku = {sku: skuCopy.sku, almacen: skuCopy.almacen, precio_oferta: skuCopy.precio_oferta};
            scannedSkus.push(newScannedSku);
            addListSku(newScannedSku, scannedSkus.length - 1);
            summaryTableConstruction();
        } else {
            showToastSwetAlert(`No hay stock suficiente para el SKU ${sku}`, 'warning');
        }
    }
};

const addSkuNotExist = async (sku, almacen) => {
    try {
        const response = await getSKU(sku, almacen);

        if (response.error) {
            showToastSwetAlert(`Error al obtener el SKU ${sku}. ${response.error}`, 'warning', 5000);
            return;
        }

        if (!validateStockResponse(response.stock)) {
            showToastSwetAlert(`No hay stock para el SKU ${sku}`, 'warning', 5000);
            return;
        }

        const precio_oferta = calculatePrecioFinal(
            response.precio_etiq,
            valor.value,
            tipoValor.value
        );

        if (!validateFinalPrice(precio_oferta, response.precio_etiq)) {
            return showToastSwetAlert(`El precio oferta "${precio_oferta}" no puede ser mayor o igual al precio de etiqueta "${response.precio_etiq}"`, 'warning', 5000);
        }

        response.cantidad = 1;
        response.sku = sku;
        response.almacen = tienda.value;
        response.precio_oferta = precio_oferta;

        responseSkus.push(response);
        const newScannedSku = {sku: response.sku, almacen: response.almacen, precio_oferta: response.precio_oferta};
        scannedSkus.push(newScannedSku);
        addListSku(newScannedSku, scannedSkus.length - 1);
        summaryTableConstruction();
    } catch (error) {
        showToastSwetAlert(`Ocurrió un error inesperado: ${error}`, 'warning');
    }
};

const addSku = async (sku, almacen) => {
    try {
        showLoadingOverlay();
        const matchingSkus = responseSkus.filter(
            responseSKU => responseSKU.sku === sku && responseSKU.almacen === almacen
        );
        if(!matchingSkus.length) {
            await addSkuNotExist(sku, almacen);
            return hideLoadingOverlay();
        }
        //calculamos el precio_oferta
        const precio_oferta = calculatePrecioFinal(matchingSkus[0]?.precio_etiq, +valor.value, tipoValor.value);
        const matchingSkuWithPrice = findMatchingSkuWithPrice(matchingSkus, precio_oferta);
        matchingSkuWithPrice ? addSkuExist(sku, matchingSkuWithPrice,matchingSkus ) : await addSkuNotExist(sku, almacen);
        hideLoadingOverlay();
        // addDeleteListener();
    } catch (error) {
        showToastSwetAlert(`Error inesperado: ${error}`, 'warning');
        hideLoadingOverlay();
    }
};

const findMatchingSkuWithPrice = (matchingSkus, precio_oferta) => {
    if (!matchingSkus.length) return false;
    return matchingSkus.find(sku => sku.precio_oferta === +precio_oferta)
}

const formartSku = (sku) => {
    //retornar los 11 primeros digitos
    return sku.substring(0, 11)
}

// Eventos
inputSku.addEventListener('keyup', (e) => {
    const sku = e.target.value;

    if (!sku) return;

    if (e.key === 'Enter') {
        //opcion 1: sean 11 dígitos
        //opcion 2: sean 23 dígitos

        if (validateSku(sku) || validateSkuWithCU(sku)) {
            const skuFormated = formartSku(sku);
            addSku(skuFormated, tienda.value);
        } else {
            showToastSwetAlert(`El SKU ${sku} no es válido.`, 'warning');
        }

        e.target.value = '';
    }
});


// Referencias al DOM
const btnNext = document.getElementById('btn-next');
const containerBtn = document.getElementById('container-btn');

const validateScannedSkus = () => scannedSkus.length > 0;

const summaryTableConstruction = () => {
    const tableHTML = `
    <table class="table table-hover table-bordered table-sm">
        <thead>
            <tr>
                ${keysSummary.map(key => `<th>${enumTitlesSummaryTable[key]}</th>`).join('')}
            </tr>
        </thead>
        <tbody id="body-summary-table">
            ${responseSkus.map((sku, index) => `
                <tr>
                    ${keysSummary.map(key => `<td>${sku[key] ?? ''}</td>`).join('')}
                </tr>
            `).join('')}
        </tbody>
    </table>
    `;

    containerTable.innerHTML = tableHTML;
};

const constructionBtns = () => {
    btnNext.hidden = true
    skusList.hidden = true
    containerTable.hidden = false
    containerBtn.innerHTML = btns
    addListenersBtns()
    summaryTableConstruction()
}

const handleSaveClick = async () => {

    const result = await showModalConfirm('¿Estás seguro de guardar el lote?', 'question');

    if (!result) return;

    try {
        showLoadingOverlay();
        const body = bodyConstruction();
        const response = await postLOTE(body);
        if (response.error) {
            showToastSwetAlert(`Error al guardar el lote: ${response.error}`, 'warning');
            return hideLoadingOverlay();
        }

        bodyGlobal = response;
        const copyResponseSkus = [...responseSkus];
        responseSkus = bodyGlobal.items;
        asignStocks(copyResponseSkus);
        showToastSwetAlert('Lote guardado correctamente', 'success');
        resetForm();
        reloadRecords.emit('reload');
        hideLoadingOverlay();
    } catch (error) {
        showToastSwetAlert(`Error inesperado al guardar: ${error}`, 'warning', 5000);
        hideLoadingOverlay();
    }
};

const asignStocks = (copyResponseSkus) => {
    responseSkus.forEach((sku) => {
        const copySku = copyResponseSkus.find((copySku) => copySku.sku === sku.sku && copySku.almacen === sku.almacen && copySku.precio_oferta === sku.precio_oferta);
        sku.stock = copySku.stock;
    });
}

const resetUIAfterSave = () => {
    containerBtn.innerHTML = '';
    btnNext.hidden = false;
    skusList.hidden = false;
    containerTable.hidden = true;
};

const handleBackClick = () => {
    resetUIAfterSave();
};

const addListenersBtns = () => {
    const btnSave = document.getElementById('btn-save')
    const btnBack = document.getElementById('btn-back')
    btnSave.addEventListener('click', handleSaveClick);
    btnBack.addEventListener('click', handleBackClick);
}

const bodyConstruction = () => {
    if (bodyGlobal && bodyGlobal.items?.length) {
        let newBody = { ...bodyGlobal }
        newBody.items = responseSkus.map(sku => {
            let item = {
                sku: sku.sku,
                almacen: sku.almacen,
                precio_oferta: sku.precio_oferta,
                cantidad: sku.cantidad,
                id_producto: sku.id_producto,
                stock_actual: sku.stock_actual,
                id_prod_sku: sku.id_prod_sku
            }
            sku.id && (item.id = sku.id)
            return item
        })
        delete newBody.createdAt
        delete newBody.updatedAt
        delete newBody.estado
        return newBody
    } else {
        return {
            persona_ins: user_code.value,
            items: responseSkus.map(sku => {
                return {
                    sku: sku.sku,
                    almacen: sku.almacen,
                    precio_oferta: sku.precio_oferta,
                    cantidad: sku.cantidad,
                    id_producto: sku.id_producto,
                    stock_actual: sku.stock_actual,
                    id_prod_sku: sku.id_prod_sku
                }
            })
        }
    }
}

btnNext.addEventListener('click', () => {
    if (!validateScannedSkus()) return showToastSwetAlert('No hay skus escaneados', 'warning')
    constructionBtns()
})

const btnBackToViewPrincipal = document.getElementById('btn-back-to-view-principal');

const viewPrincipal = document.getElementById('view-principal');

const cleanSummaryTable = () => {
    const bodySummaryTable = document.getElementById('body-summary-table');
    if (!bodySummaryTable) return;
    bodySummaryTable.innerHTML = '';
    summaryTableConstruction();
}

const cleanListSkus = () => {
    skusList.innerHTML = '';
}

const resetForm = () => {
    scannedSkus = [];
    responseSkus = [];
    bodyGlobal = {};
    cleanListSkus();
    cleanSummaryTable();
    resetUIAfterSave();
    valor.value = 0;
    tienda.value = 'B2';
}

const backToViewPrincipal = async () => {
    if (scannedSkus.length) {
        const result = await showModalConfirm('¿Estás seguro de volver a la vista principal?', 'warning');
        if (!result) return;
    }
    showLoadingOverlay()
    await delay(500);
    hideLoadingOverlay();
    resetForm();
    app.hidden = true;
    viewPrincipal.hidden = false;
}


btnBackToViewPrincipal.addEventListener('click', backToViewPrincipal);

app.hidden = true;
