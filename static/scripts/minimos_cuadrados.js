const dependent = document.getElementById('dependent');
const independent = document.getElementById('independent');
const dataNav = document.querySelector('.data_nav');
const skeleton = document.querySelector('.skeleton');
const btnAdd = document.querySelector('.btn_add');
const xValue = document.getElementById('x');
const yValue = document.getElementById('y');
const form = document.querySelector('.form');
const dataContainer = document.querySelector('.data_container');
const nav = document.querySelector('.nav');
const ctx = document.getElementById('chart');
let chart;

let data = [];
let dataCounter = 1;
let forecastedData = [];
let actualUpdateRecord = 0;

ctx.addEventListener('click', (e) => {
    
    const chartContainer = document.querySelector('.chart_container');

    if(!chartContainer.classList.contains('absolute')) {
        chartContainer.classList.add('bg-white', 'absolute', 'top-5', 'left-5', 'bottom-5', 'right-5', 'z-10');
        document.querySelector('.modal').classList.remove('hidden');
        return;
    }

    chartContainer.classList.remove('bg-white', 'absolute', 'top-5', 'left-5', 'bottom-5', 'right-5', 'z-10');
    document.querySelector('.modal').classList.add('hidden');
})

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    cleanRecords();
    skeleton.classList.remove('hidden');

    const resp = await fetch('/method/minimos_cuadrados', {
        method: 'POST',
        body: JSON.stringify({
            data,
            xName: independent.value,
            yName: dependent.value
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const res_data = await resp.json();
    skeleton.classList.add('hidden');
    document.querySelector('.data_nav').classList.add('hidden');
    document.querySelector('.res_dependent').textContent = dependent.value;
    document.querySelector('.res_independent').textContent = independent.value;
    document.querySelector('.result_nav').classList.remove('hidden');
    nav.children[1].classList.add('underline');
    nav.children[0].classList.remove('underline');
    forecastedData = res_data.forecastedData;
    renderRecords(forecastedData, true);
    
    if(chart) {
        chart.destroy();
    }

    const orderedData = [...forecastedData].sort((a,b) => a.xValue - b.xValue);

    chart = new Chart(ctx, {
        data: {
            datasets: [
                {
                    type: 'line',
                    label: 'Pronostico',
                    data: [...new Set(orderedData.map(record => record.yForecasted))],
                    backgroundColor: 'rgb(54, 162, 235)'
                },
                {
                    type: 'scatter',
                    label: 'Datos Reales',
                    data: [...new Set(orderedData.map(record => ({
                        x: record.xValue,
                        y: record.yValue
                    })))],
                    backgroundColor: 'rgb(255, 99, 132)'
                }
            ],
            labels: [...new Set(orderedData.map(record => record.xValue))]
        }
    });

    ctx.style.display = 'none';
})

nav.addEventListener('click', (e) => {
    
    if(e.target.textContent === 'Datos') {
        nav.children[0].classList.add('underline');
        nav.children[1].classList.remove('underline');
        nav.children[2].classList.remove('underline');
        ctx.style.display = 'none';
        document.querySelector('.data_nav').classList.remove('hidden');
        document.querySelector('.result_nav').classList.add('hidden');
        cleanRecords();
        renderRecords(data);
        return;
    } else if (e.target.textContent === 'Resultados') {
        cleanRecords();
        renderRecords(forecastedData, true);
        nav.children[1].classList.add('underline');
        nav.children[0].classList.remove('underline');
        nav.children[2].classList.remove('underline');
        ctx.style.display = 'none';
        document.querySelector('.data_nav').classList.add('hidden');
        document.querySelector('.result_nav').classList.remove('hidden');
        document.querySelector('.res_dependent').textContent = dependent.value;
        document.querySelector('.res_independent').textContent = independent.value;
        return;
    } else if(e.target.textContent === 'Grafico') {
        cleanRecords();
        ctx.style.display = 'block';
        nav.children[0].classList.remove('underline');
        nav.children[1].classList.remove('underline');
        nav.children[2].classList.add('underline');
        document.querySelector('.data_nav').classList.add('hidden');
        document.querySelector('.result_nav').classList.add('hidden');
    }
    
});

dependent.addEventListener('input', (e) => {

    document.querySelector('.dependent').textContent = e.target.value;
})

independent.addEventListener('input', (e) => {

    document.querySelector('.independent').textContent = e.target.value;
})

btnAdd.addEventListener('click', (e) => {

    const xNumValue = parseFloat(xValue.value);

    if(isNaN(xNumValue)) {

        const xError = document.createElement('div');
        xError.textContent = 'El campo x solo permite numeros';
        xError.classList.add('bg-red-200', 'text-red-500', 'text-lg', 'font-medium', 'py-1', 'px-2', 'rounded-md', 'absolute', 'bottom-5', 'right-5');

        form.appendChild(xError);

        setTimeout(() => {
            form.removeChild(xError)
        }, 5000)
        
        return;
    }

    const yNumValue = parseFloat(yValue.value);

    if (isNaN(yNumValue)) {
        const yError = document.createElement('div');
        yError.textContent = 'El campo y solo permite numeros';
        yError.classList.add('bg-red-200', 'text-red-500', 'text-lg', 'font-medium', 'py-1', 'px-2', 'rounded-md', 'absolute', 'bottom-5', 'right-5');

        form.appendChild(yError)
        
        setTimeout(() => {
            form.removeChild(yError)
        }, 5000);
        return;
    }

    if(btnAdd.textContent === 'Actualizar') {

        data.map(record => {
            if(record.id === actualUpdateRecord) {
                record.xValue = xNumValue,
                record.yValue = yNumValue
            }
        })

        btnAdd.textContent = 'Agregar'
        cleanRecords();
        renderRecords(data);
        return;
    }

    data.push({
        id: dataCounter,
        yValue: yNumValue,
        xValue: xNumValue,
    });

    yValue.value = null;
    xValue.value = null;

    cleanRecords();
    renderRecords(data);
    
    dataCounter++;
})

function deleteRecord(recordId) {

    data = data.filter(record => {
        if(record.id > recordId) {
            record.id--;
            return true;
        }

        if(record.id !== recordId) return true;
        
        return false;
    });

    cleanRecords();
    renderRecords(data);

    dataCounter--;
}

function updateRecord(recordId) {

    const actualRecord = data.find(record => record.id === recordId);

    yValue.value = actualRecord.yValue;
    xValue.value = actualRecord.xValue;

    btnAdd.textContent = 'Actualizar';
    actualUpdateRecord = recordId;
}

function renderRecords(data, isResult = false) {
    data.forEach(record => {

        const {yValue, xValue, yForecasted} = record;

        const newRecord = document.createElement('div');
        newRecord.classList.add('grid', 'p-1', 'place-items-center','border-t-[1px]', 'grid-cols-3');

        const yDisplayVal = document.createElement('p');
        yDisplayVal.classList.add('text-lg', 'font-bold')
        yDisplayVal.textContent = yValue;
        const xDisplayVal = document.createElement('p');
        xDisplayVal.classList.add('text-lg', 'font-bold')
        xDisplayVal.textContent = xValue;

        let options = null;
        let yForecastedDisplayVal;

        if(!isResult) {
            options = document.createElement('div');
            options.classList.add('flex', 'items-center', 'justify-evenly', 'place-self-stretch');
            const btnDelete = document.createElement('button');
            btnDelete.classList.add('text-gray-600', 'cursor-pointer', 'hover:text-red-500');
            btnDelete.onclick = () => deleteRecord(record.id);
            btnDelete.innerHTML = `
                <svg class="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
            `;
            const btnUpdate = document.createElement('button');
            btnUpdate.classList.add('text-gray-600', 'cursor-pointer','hover:text-green-500');
            btnUpdate.onclick = () => updateRecord(record.id);
            btnUpdate.innerHTML = `
                <svg class="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z"/></svg>
            `;
            options.appendChild(btnUpdate);
            options.appendChild(btnDelete);
        } else {
            yForecastedDisplayVal = document.createElement('p');
            yForecastedDisplayVal.classList.add('text-lg', 'font-bold')
            yForecastedDisplayVal.textContent = yForecasted;
        }

        newRecord.appendChild(yDisplayVal);
        newRecord.appendChild(xDisplayVal);
        options ? newRecord.appendChild(options): '';
        yForecastedDisplayVal ? newRecord.appendChild(yForecastedDisplayVal): '';
        dataContainer.appendChild(newRecord);
    });
}

function cleanRecords() {
    dataContainer.innerHTML = "";
}