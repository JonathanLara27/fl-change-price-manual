export const cardForm = `
<div class="card">
    <div class="card-header mb-3 d-flex justify-content-center align-items-center gap-4 ">
        <button class="btn btn-dark d-flex justify-content-center align-items-center" id="btn-back-to-view-principal" title="Regresar">
            <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <h2>Cambio de precios de SKUs</h2>
    </div>
    <section class="p-4" id="form">

    <div class="mb-3">
        <label for="tienda" class="form-label">Almacen</label>
        <select class="form-select" id="tienda">
            <option value="B2" selected>B2</option>
            <option value="N4">N4</option>
            <option value="C3">C3</option>
            <option value="59">59</option>
        </select>
    </div>

    <div class="mb-3">
        <label for="tipoValor" class="form-label">Tipo de Valor</label>
        <select class="form-select" id="tipoValor">
            <option value="monto_final" selected>Precio final</option>
            <option value="porcentaje">Porcentaje</option>
        </select>
    </div>

    
    <div class="form-floating mb-3">
        <input type="number" min=0 step=0.1 class="form-control" id="valor" placeholder="Valor">
        <label for="valor" id="labelValor">Precio final</label>
    </div>
        <span class="text-danger text-sm" id=error-valor>
    </span>
    <div class="form-floating mb-3">
        <input type="text" class="form-control" id="sku" placeholder="SKU" disabled>
        <label for="sku">SKU</label>
    </div>

    </section>

    <section>
        <h3 class="card-header">
            Skus Escaneados
        </h3>

        <div class="card-body">
            <ul class="list-group ul-sku-container" id="skusList"></ul>
            <div class="table-responsive"></div>
        </div>

    </section>

    <div class="mb-3 d-flex justify-content-center ">
        <button class="btn btn-primary" id="btn-next">Siguiente</button>
    </div>
    <div class="mb-3 d-flex justify-content-center gap-3" id="container-btn">
    </div>
</div>
`
export const btns = `
<button class="btn btn-dark" id="btn-back">Atrás</button>
<button class="btn btn-primary" id="btn-save">Guardar</button>
`

export const messageErrorDescuento = 'El descuento debe estar entre 0 y 100.'
export const messageErrorPrecio = 'El precio final debe ser mayor a 0.'

export const estados = ['PENDIENTE', 'APROBADO','CANCELADO']

export const validateSku = (sku) => {
    return sku.length === 11 && sku.startsWith('18')
}

export const validateSkuWithCU = (sku) => {
    return sku.length === 23 && sku.startsWith('18')
}

export const validatePrecioFinal = (valor) => {
    return valor && valor > 0
}

export const validateDescuento = (valor) => {
    return valor && valor >= 0 && valor <= 100
}

export const validateStockResponse = (stock) => {
    return stock > 0
}

export const validateStock = (cantidad, stock) => {
    return cantidad < stock
}

export const calculatePrecioFinal = (precio, valor, tipoValor) => {
    return tipoValor === 'monto_final' ? +valor : +(+precio - +(+precio * +valor / 100).toFixed(2)).toFixed(2)
}

// export const URLBASE = `https://apistest.footloose.pe/tools/api/v1/control-inventario/lote`
export const URLBASE = `https://apis.footloose.pe/tools/api/v1/control-inventario/lote`
// export const URLBASEPRINT =`https://apistest.footloose.pe/api-rest/icq01/sip/compras/producto`
export const URLBASEPRINT =`https://apis.footloose.pe/api-rest/icq01/sip/compras/producto`
export const user_code = document.querySelector('#user_code');

export const formatPeruTimeWithMilliseconds = (data) => {
    const date = new Date(data);
    date.setHours(date.getHours() + 5);

    // Obtener componentes de la fecha
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Los meses van de 0 a 11
    const year = date.getFullYear();

    // Obtener componentes de la hora
    const hours = date.getHours() % 12 || 12;
    const period = date.getHours() >= 12 ? 'p. m.' : 'a. m.';
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = date.getMinutes().toString().padStart(2, '0');
    const formattedSeconds = date.getSeconds().toString().padStart(2, '0');

    // Formatear la fecha y hora
    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${period}`;

    const finalFormattedDate = `${formattedDate} ${formattedTime}`;

    return finalFormattedDate;
};


export const enumTitlesSummaryTable = {
    sku: 'SKU',
    almacen: 'Almacén',
    precio_oferta: 'Precio de oferta',
    cantidad: 'Cantidad',
    // acciones: 'Acciones',
};

export const keysSummary = Object.keys(enumTitlesSummaryTable);

export const columsTablePrincipal = {
    id_registro: 'ID registro',
    persona_ins: 'Código de usuario',
    user_name: 'Nombre de usuario',
    createdAt: 'Fecha de creación',
    estado: 'Estado',
    // sku: 'SKU',
    almacen: 'Almacén',
    // precio_oferta: 'Precio oferta',
    cantidad: 'Cantidad',
    acciones: 'Acciones',
};

export const keysTablePrincipal = Object.keys(columsTablePrincipal);

export const showRowTablePrincipal = {
    id_registro: (value) => value,
    persona_ins: (value) => value,
    user_name: (value) => value,
    createdAt: (value) => formatPeruTimeWithMilliseconds(value),
    estado: (value) => value,
    // sku: (value) => value,
    almacen: (value) => value,
    // precio_oferta: (value) => (+value).toFixed(2),
    cantidad: (value) => value,
};

export const mapStyleState = {
    'PENDIENTE': 'state-pending',
    'APROBADO': 'state-approved',
    'CANCELADO': 'state-canceled',
}

export const styleRowTablePrincipal = {
    id_registro: (value) => 'text-end',
    persona_ins: (value) => 'text-end',
    user_name: (value) => '',
    createdAt: (value) => 'text-center',
    estado: (value) => `state ${mapStyleState[value] || ''}`,
    // sku: (value) => '',
    almacen: (value) => 'text-center',
    // precio_oferta: (value) => '',
    cantidad: (value) => 'text-end',
}

export const tablaPrincipalHTML = `
<div class="card" id="card-table-principal">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h2>Tabla de Registros</h2>
        <button class="btn btn-dark btn-sm d-flex align-items-center" title="Añadir registro" id="btn-add">
            <span class="material-symbols-outlined">post_add</span>
        </button>
    </div>

    <div class="table-responsive p-2" id="table-principal">
        <table class="table table-hover table-bordered">
            <thead class="sticky-top">
                <tr>
                    ${keysTablePrincipal.map(key => `<th>${columsTablePrincipal[key]}</th>`).join('')}
                </tr>
            </thead>
            <tbody id="table-body">
            </tbody>
        </table>
    </div>

    <div class="m-2 p-2">
        <div class="pagination justify-content-center">
            <nav>
                <ul class="pagination">
                    <li class="page-item disabled" id="firstPageBtn">
                        <a class="page-link" href="#" tabindex="-1">Primera</a>
                    </li>
                    <li class="page-item disabled" id="prevPageBtn">
                        <a class="page-link" href="#" tabindex="-1">Anterior</a>
                    </li>
                    <li class="page-item" id="currentPage">
                        <span class="page-link"></span>
                    </li>
                    <li class="page-item disabled" id="nextPageBtn">
                        <a class="page-link" href="#" tabindex="-1">Siguiente</a>
                    </li>
                    <li class="page-item disabled" id="lastPageBtn">
                        <a class="page-link" href="#" tabindex="-1">Última</a>
                    </li>
                </ul>
            </nav>
        </div>
    </div>
</div>
`;

const loadingOverlay = document.getElementById('loading-overlay');
// Función para mostrar la capa de carga
export const showLoadingOverlay = () => {
    loadingOverlay.style.display = 'flex';
}

// Función para ocultar la capa de carga
export const hideLoadingOverlay = () => {
    loadingOverlay.style.display = 'none';
}

const toastTypeSweetAlert = ['success', 'error', 'warning', 'info', 'question'];

export const showToastSwetAlert = (message, type = 'info', time = 2000) => {
    Swal.fire({
        icon: type,
        title: message,
        position: 'bottom-end',
        toast: true,
        showConfirmButton: false,
        timer: time,
        showCloseButton: true,
    });
}

export const showModalConfirm = async (message, type = 'warning') => {
    const result = await Swal.fire({
        icon: type,
        title: message,
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'No',
        showCloseButton: true,
    });

    return result.isConfirmed;
}

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const viewInfoHTML = `

<card class="card">
    <div class="card-header mb-3 d-flex justify-content-center align-items-center gap-4 ">
        <button class="btn btn-dark d-flex justify-content-center align-items-center" id="btn-back-info" title="Regresar">
            <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <h3>Resumen del registro con id: <span id="cabecera-info-id"></span> </h3>
    </div>

    <div class="table-responsive p-2">
    <table class="table table-hover table-bordered table-sm">
        <thead>
            <tr>
                ${keysSummary.map(key => `<th>${enumTitlesSummaryTable[key]}</th>`).join('')}
            </tr>
        </thead>
        <tbody id="body-info-table">
        </tbody>
    </table>
    </div>
</card>
`


