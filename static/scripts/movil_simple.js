const form = document.querySelector('.form');
const select = document.getElementById('periodo');
const cantidad = document.getElementById('cantidad');
const periodoContainer = document.querySelector('.periodo_container');
const cantidadContainer = document.querySelector('.cantidad_container');
const skeleton = document.querySelector('.skeleton');
const dataContainer = document.querySelector('.data_container');
const records = document.querySelectorAll('.record');
const btnSubmit = document.querySelector('.btn_submit');
const btnPronosticar = document.querySelector('.btn_pronosticar');
const selectPeriodos = document.querySelector('.sel_periodos');
const nav = document.querySelector('.nav');
const ctx = document.getElementById('chart');
let chart;

let dataCounter = 1;
let periodDemands = [];
let forecastedPeriods = [];
let actualUpdatePeriod = 0;

nav.addEventListener('click', (e) => {
    
    if(e.target.textContent === 'Datos') {
        nav.children[0].classList.add('underline');
        nav.children[1].classList.remove('underline');
        nav.children[2].classList.remove('underline');
        ctx.style.display = 'none';
        document.querySelector('.data_nav').classList.remove('hidden');
        document.querySelector('.result_nav').classList.add('hidden');
        cleanPeriods();
        renderPeriods(periodDemands);
        return;
    } else if (e.target.textContent === 'Resultados') {
        cleanPeriods();
        renderPeriods(forecastedPeriods, true);
        nav.children[1].classList.add('underline');
        nav.children[0].classList.remove('underline');
        nav.children[2].classList.remove('underline');
        ctx.style.display = 'none';
        document.querySelector('.data_nav').classList.add('hidden');
        document.querySelector('.result_nav').classList.remove('hidden');
        return;
    } else if(e.target.textContent === 'Grafico') {
        cleanPeriods();
        ctx.style.display = 'block';
        nav.children[0].classList.remove('underline');
        nav.children[1].classList.remove('underline');
        nav.children[2].classList.add('underline');
        document.querySelector('.data_nav').classList.add('hidden');
        document.querySelector('.result_nav').classList.add('hidden');
    }
    
})

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if(select.value === '') {

        const periodoError = document.createElement('div');
        periodoError.textContent = 'Selecciona un periodo correcto';
        periodoError.classList.add('bg-red-200', 'text-red-500', 'text-lg', 'font-medium', 'py-1', 'px-2', 'rounded-md', 'absolute', 'bottom-5', 'right-5');

        form.appendChild(periodoError);

        setTimeout(() => {
            form.removeChild(periodoError)
        }, 5000)
        
        return;
    }

    const numQuantity = parseInt(cantidad.value);

    if (isNaN(numQuantity) || numQuantity < 1) {
        const cantidadError = document.createElement('div');
        cantidadError.textContent = 'El campo cantidad debe ser un numero entero mayor a 0';
        cantidadError.classList.add('bg-red-200', 'text-red-500', 'text-lg', 'font-medium', 'py-1', 'px-2', 'rounded-md', 'absolute', 'bottom-5', 'right-5');

        form.appendChild(cantidadError)
        
        setTimeout(() => {
            form.removeChild(cantidadError)
        }, 5000);
        return;
    }

    if(btnSubmit.textContent === 'Actualizar') {

        periodDemands.map(period => {
            if(period.period === actualUpdatePeriod) {
                period.frequency = select.value,
                period.quantity = numQuantity
            }
        })

        btnSubmit.textContent = 'Agregar'
        cleanPeriods();
        renderPeriods(periodDemands);
        return;
    }

    periodDemands.push({
        period: dataCounter,
        quantity: numQuantity,
        frequency: select.value
    });

    cantidad.value = null;

    cleanPeriods();
    renderPeriods(periodDemands);
    
    dataCounter++;
});

btnPronosticar.addEventListener('click', async (e) => {

    const periodsToWorkWith = parseInt(selectPeriodos.value);

    if(periodDemands.length < periodsToWorkWith) {
        const periodsError = document.createElement('div');
        periodsError.textContent = 'No puedes realizar un pronostico con menos periodos de los que planeas trabajar';
        periodsError.classList.add('bg-red-200', 'text-red-500', 'text-lg', 'font-medium', 'py-1', 'px-2', 'rounded-md', 'absolute', 'bottom-5', 'right-5');

        form.appendChild(periodsError)
        
        setTimeout(() => {
            form.removeChild(periodsError)
        }, 5000);
        return;
    }

    cleanPeriods();
    skeleton.classList.remove('hidden');

    const res = await fetch('/method/promedio_simple', {
        method: 'POST',
        body: JSON.stringify({
            periods: periodDemands,
            periodsToWorkWith
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });

    forecastedPeriods = await res.json();
    skeleton.classList.add('hidden');
    document.querySelector('.data_nav').classList.add('hidden');
    document.querySelector('.result_nav').classList.remove('hidden');
    nav.children[1].classList.add('underline');
    nav.children[0].classList.remove('underline');
    renderPeriods(forecastedPeriods, true);
    
    if(chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: forecastedPeriods.map(forPeriod => forPeriod.period),
            datasets: [
                {
                    label: 'Demanda Real',
                    data: forecastedPeriods.map(({quantity}) => quantity === 0 ? null: quantity),
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Demanda Pronosticada',
                    data: forecastedPeriods.map(({forecasted_quantity}) => forecasted_quantity === 0 ? null: forecasted_quantity),
                    fill: false,
                    borderColor: 'rgb(75, 255, 112)',
                    tension: 0.1
                }
            ]
        }
    });

    ctx.style.display = 'none';

})

function deletePeriod(periodId) {

    periodDemands = periodDemands.filter(period => {
        if(period.period > periodId) {
            period.period--;
            return true;
        }

        if(period.period !== periodId) return true;
        
        return false;
    });

    cleanPeriods();
    renderPeriods(periodDemands);

    dataCounter--;
}

function updatePeriod(periodId) {

    const actualPeriod = periodDemands.find(period => period.period === periodId);

    select.value = actualPeriod.frequency;
    cantidad.value = actualPeriod.quantity;

    btnSubmit.textContent = 'Actualizar';
    actualUpdatePeriod = periodId;
}

function renderPeriods(periodDemands, isResult = false) {
    periodDemands.forEach(period => {

        const {period: periodId, quantity, forecasted_quantity, difference} = period;

        const newRecord = document.createElement('div');
        newRecord.classList.add('grid', 'grid-cols-3', 'p-1', 'place-items-center','border-t-[1px]', `${isResult ? 'grid-cols-4': 'grid-cols-3'}`);

        const periodo = document.createElement('p');
        periodo.classList.add('text-lg', 'font-bold')
        periodo.textContent = periodId;
        const demanda = document.createElement('p');
        demanda.classList.add('text-lg', 'font-bold')
        demanda.textContent = quantity;

        let options = null;
        let forecastedP;
        let differenceP;

        if(!isResult) {
            options = document.createElement('div');
            options.classList.add('flex', 'items-center', 'justify-evenly', 'place-self-stretch');
            const btnDelete = document.createElement('button');
            btnDelete.classList.add('text-gray-600', 'cursor-pointer', 'hover:text-red-500');
            btnDelete.onclick = () => deletePeriod(periodId);
            btnDelete.innerHTML = `
                <svg class="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
            `;
            const btnUpdate = document.createElement('button');
            btnUpdate.classList.add('text-gray-600', 'cursor-pointer','hover:text-green-500');
            btnUpdate.onclick = () => updatePeriod(periodId);
            btnUpdate.innerHTML = `
                <svg class="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z"/></svg>
            `;
            options.appendChild(btnUpdate);
            options.appendChild(btnDelete);
        } else {
            forecastedP = document.createElement('p');
            forecastedP.classList.add('text-lg', 'font-bold')
            forecastedP.textContent = forecasted_quantity;
            differenceP = document.createElement('p');
            differenceP.classList.add('text-lg', 'font-bold')
            differenceP.textContent = difference;
        }

        newRecord.appendChild(periodo);
        newRecord.appendChild(demanda);
        options ? newRecord.appendChild(options): '';
        forecastedP ? newRecord.appendChild(forecastedP): '';
        differenceP ? newRecord.appendChild(differenceP): '';
        dataContainer.appendChild(newRecord);
    });
}

function cleanPeriods() {
    dataContainer.innerHTML = "";
}