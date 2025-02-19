import { URLBASE, URLBASEPRINT, delay, estados, showToastSwetAlert } from './constants.js'
import {contraseña,contraseñaPrint,usuario,usuarioPrint} from './ENV.js';

const credencialesEnBase64 = btoa(usuario + ':' + contraseña);

const credencialesPrintEnBase64 = btoa(usuarioPrint + ':' + contraseñaPrint);

export const getSKU = async (sku, almacen) => {
    try {
        const response = await fetch(`${URLBASE}/product-information/${sku}/${almacen}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credencialesEnBase64}`,
            }
        });

        if (!response.ok) {
            const { data, code } = await response.json();
            if (response.status === 404) {
                throw new Error(`No se encontró el producto con stock en la tienda especificada ${almacen}.`);
            }

            throw new Error(`Error en la solicitud: ${code} ${data}`);
        }

        let { data } = await response.json();
        if (data && !data.stock) data.stock = 0
        return { precio_etiq: data.precio_etiq, stock: data.stock, id_producto: data.id_producto, stock_actual: data.stock, id_prod_sku: data.id_prod_sku };

    } catch (error) {
        return { error: error };
    }
}

export const postLOTE = async (body) => {
    try {
        const response = await fetch(`${URLBASE}/preload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credencialesEnBase64}`,
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const { data, code } = await response.json();
            throw new Error(`Error en la solicitud: ${code} ${data}`);
        }

        let { data } = await response.json();

        return data;

    } catch (error) {
        return { error: error.message };
    }
}

export const getLOTES = async (page = 1, limit = 10, filtro) => {
    let params = '';
    if (Array.isArray(filtro) && filtro.length) {
        params = setFilterParams(filtro, limit, page, 'createdAt,desc');
    } else {
        params = '?limit=' + limit + '&page=' + page + '&order=createdAt,desc';
    }
    try {
        //haremos una carga forzada de mínimo 200 milisegundos
        await delay(200);
        const response = await fetch(`${URLBASE}/preload${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credencialesEnBase64}`,
            }
        });
        if (!response.ok || response.status === 204) {
            throw new Error(response.status === 204 ? 'No se encontraron datos.' : `Error en la solicitud: ${response.code} ${response.data}`);
        }

        let { data } = await response.json();
        if (!data || !data.rows || !data.meta) {
            throw new Error('La respuesta del servidor tiene un formato inesperado.');
        }
        let { rows, meta } = data;
        let formatData = formatLotes(rows);
        return { data: formatData, meta };
    } catch (error) {
        throw error;
    }
}

const setFilterParams = (filtro, limit, page, order) => {
    const keys = filtro.map((f) => f.key).join(',');
    const operators = filtro.map((f) => f.operator).join(',');
    const values = filtro
        .map((f) => {
            if (
                f.operator === 'eq' ||
                f.operator === 'ne' ||
                f.operator === 'startsWith'
            ) {
                return '"' + f.value + '"';
            } else if (f.operator === 'between') {
                return '["' + f.value[0] + '","' + f.value[1] + '"]';
            } else if (f.operator === 'in') {
                return '[' + f.value.map((v) => '"' + v + '"').join(',') + ']';
            }
            else {
                return f.value;
            }
        })
        .join(',');
    const valuecocat = '[' + values + ']';
    return '?limit=' + limit + '&page=' + page + '&order=' + order + '&key=' + keys + '&operator=' + operators + '&value=' + valuecocat;
}

const formatLotes = (rows) => {
    try {
        return rows.map((record) => ({
            id_registro: record.id,
            persona_ins: record.persona_ins,
            createdAt: record.createdAt,
            almacen: record.items[0]?.almacen ?? '-',
            cantidad: record.items?.reduce((acc, item) => acc + item.cantidad, 0) ?? 0,
            user_name: record.personaNombres ?? '',
            estado: record.estado,
            ...record
        }));
    } catch (error) {
        showToastSwetAlert('Error al formatear los lotes', 'warning', 5000);
    }
}

export const putStateLote = async (id, estado) => {
    if (!estados.includes(estado)) {
        throw new Error(`El estado "${estado}" no es válido.`);
    }
    if (!id) {
        throw new Error('El id del registro no puede ser nulo.');
    }
    try {
        const response = await fetch(`${URLBASE}/preload/${id}/${estado}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credencialesEnBase64}`,
            },
            body: null
        });
        if (!response.ok) {
            const responseJson = await response.json();
            throw new Error(`${responseJson.data}. Código: ${responseJson.code}` || 'Error en la solicitud.');
        }
    } catch (error) {
        throw error;
    }
}

// Función para convertir JSON a Excel
export const jsonToExcel = (jsonData, fileName) => {
    // Crear una hoja de trabajo (worksheet) a partir del JSON
    const worksheet = XLSX.utils.json_to_sheet(jsonData);

    // Crear un libro de trabajo (workbook)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Escribir el archivo Excel
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};


export const printTAGS = async (id) => {
    if (!id) {
        throw new Error('El id del registro no puede ser nulo.');
    }
    try {
        const response = await fetch(`${URLBASEPRINT}/printTicketB2/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credencialesPrintEnBase64}`,
            }
        })
        if (!response.ok) {
            const { error } = await response.json();
            throw new Error(`Error en la solicitud: ${error.msg}`);
        }
    } catch (error) {
        throw error;
    }
}

export const printTAGSText = async (id) => {
    if (!id) {
        throw new Error('El id del registro no puede ser nulo.');
    }
    try {
        const response = await fetch(`${URLBASEPRINT}/printTicketB2Text/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credencialesPrintEnBase64}`,
            }
        })
        if (!response.ok) {
            const { error } = await response.json();
            throw new Error(`Error en la solicitud: ${error.msg}`);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

export const printTAGSLocal = async (texto) => {
    if (!texto) {
        throw new Error('El texto no puede ser nulo.');
    }
    try {
        const response = await fetch(`http://localhost:3000/print/etiquetas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credencialesPrintEnBase64}`,
            },
            body: JSON.stringify({ texto })
        })
        if (!response.ok) {
            const { error } = await response.json();
            throw new Error(`Error en la solicitud: ${error.msg}`);
        }
    } catch (error) {
        throw error;
    }
}


export const getDataToExport = async (id) => {
    if (!id) {
        throw new Error('El id del registro no puede ser nulo.');
    }
    try {
        const response = await fetch(`${URLBASE}/preload/${id}/impresion-etiquetas`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credencialesEnBase64}`,
            }
        });
        const { data, code } = await response.json();
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${code} ${data}`);
        }
        if (!data || !data?.length) {
            throw new Error('No se encontraron datos para exportar.');
        }
        return data;
    } catch (error) {
        throw new Error(error);
    }
}

// Crear una clase que simule un observable usando EventTarget
class Observable {
    constructor() {
        this.eventTarget = new EventTarget();
    }

    // Método para emitir valores
    emit(value) {
        const event = new CustomEvent("data", { detail: value });
        this.eventTarget.dispatchEvent(event);
    }

    // Método para suscribirse
    subscribe(callback) {
        const handler = (event) => callback(event.detail);
        this.eventTarget.addEventListener("data", handler);

        // Devolver un método para cancelar la suscripción
        return {
            unsubscribe: () => {
                this.eventTarget.removeEventListener("data", handler);
            },
        };
    }
}

export const reloadRecords = new Observable();

