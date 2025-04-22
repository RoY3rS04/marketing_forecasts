from flask import Flask, request, jsonify
from flask import render_template
import math

app = Flask(__name__)

@app.route('/')
def index():  
    return render_template('index.html')

@app.route('/method/<method>')
def method(method):
    org_method = method
    print(org_method)

    method = method.split('_')

    method = [word.capitalize() for word in method]

    method = ' '.join(method)

    match org_method:
        case 'promedio_simple':
            return render_template('movil_simple.html', method=method)
        case 'promedio_ponderado': 
            return render_template('movil_ponderado.html', method=method)
        case 'suavizacion_exponencial':
            return render_template('suavizacion_exponencial.html', method=method)
        case 'minimos_cuadrados':
            return render_template('minimos_cuadrados.html', method=method)
        case _:
            return render_template('404.html')

    

@app.route('/method/promedio_simple', methods=['POST'])
def promedioSimple():
    periods, periodsToWorkWith = request.json.values()
    forecastedPeriods = []

    for idx, period in enumerate(periods):

        forecastedPeriod = {
            'period': period['period'],
            'frequency': period['frequency'],
            'quantity': period['quantity']
        }
        if(period['period'] <= periodsToWorkWith):
            forecastedPeriod['forecasted_quantity'] = 0
        else:
            forecastedPeriod['forecasted_quantity'] = round((sum(period['quantity'] for period in periods[idx-periodsToWorkWith:idx]) / periodsToWorkWith), 2)
        forecastedPeriod['difference'] = round(abs(period['quantity'] - forecastedPeriod['forecasted_quantity']), 2)

        forecastedPeriods.append(forecastedPeriod)

    periodsLength = len(periods)

    lastPeriodForecasted = round((sum(period['quantity'] for period in periods[periodsLength-periodsToWorkWith:periodsLength]) / periodsToWorkWith), 2)

    forecastedPeriods.append({ 
        'period': periods[periodsLength - 1]['period'] + 1,
        'frequency': periods[0]['frequency'],
        'quantity': 0,
        'forecasted_quantity': lastPeriodForecasted,
        'difference': lastPeriodForecasted
    })

    return jsonify(forecastedPeriods), 200


@app.route('/method/promedio_ponderado', methods=['POST'])
def promedioPonderado(): 
    periods, periodsToWorkWith = request.json.values()
    forecastedPeriods = []

    weights = getPeriodWeights(periodsToWorkWith=periodsToWorkWith)

    for idx, period in enumerate(periods):

        forecastedPeriod = {
            'period': period['period'],
            'frequency': period['frequency'],
            'quantity': period['quantity']
        }
        if(period['period'] <= periodsToWorkWith):
            forecastedPeriod['forecasted_quantity'] = 0
        else:
            j = 0
            sum = 0
            for i in range(idx-periodsToWorkWith, idx):
                sum += periods[i]['quantity']*weights[j]
                j+=1

            forecastedPeriod['forecasted_quantity'] = round(sum, 2)

        forecastedPeriod['difference'] = round(abs(period['quantity'] - forecastedPeriod['forecasted_quantity']), 2)

        forecastedPeriods.append(forecastedPeriod)

    periodsLength = len(periods)

    j = 0
    sum = 0
    for i in range(periodsLength-periodsToWorkWith, periodsLength):
        sum += periods[i]['quantity']*weights[j]
        j+=1

    
    lastPeriodForecasted = round(sum, 2)

    forecastedPeriods.append({ 
        'period': periods[periodsLength - 1]['period'] + 1,
        'frequency': periods[0]['frequency'],
        'quantity': 0,
        'forecasted_quantity': lastPeriodForecasted,
        'difference': lastPeriodForecasted
    })

    return jsonify(forecastedPeriods), 200

@app.route('/method/suavizacion_exponencial', methods=['POST'])
def suavizacionExponencial():
    periods, alpha, startFrom = request.json.values() 
    forecastedPeriods = []

    for idx, period in enumerate(periods):

        forecastedPeriod = {
            'period': period['period'],
            'frequency': period['frequency'],
            'quantity': period['quantity']
        }

        if(idx + 1 < startFrom): 
            forecastedPeriod['forecasted_quantity'] = 0
            forecastedPeriod['difference'] = forecastedPeriod['quantity']
            forecastedPeriods.append(forecastedPeriod)
            continue

        forecastedPeriod['forecasted_quantity'] = round((
            alpha*periods[idx-1]['quantity']+(1-alpha)*(forecastedPeriods[idx-1]['forecasted_quantity'] if forecastedPeriods[idx-1]['forecasted_quantity'] > 0 else periods[idx-1]['quantity'])
        ),2)

        forecastedPeriod['difference'] = round(abs(forecastedPeriod['quantity'] - forecastedPeriod['forecasted_quantity']),2)

        forecastedPeriods.append(forecastedPeriod)

    periodsLength = len(periods)
    
    if (startFrom == periodsLength):
        forecastedPeriods.append({
            'period': periods[periodsLength - 1]['period'] + 1,
            'frequency': periods[0]['frequency'],
            'quantity': 0,
            'forecasted_quantity': period[periodsLength - 1]['quantity'],
            'difference': period[periodsLength - 1]['quantity']
        })
    else: 
        lastPeriodForecasted = abs(round(alpha*forecastedPeriods[idx]['quantity']+(1-alpha)*forecastedPeriods[idx]['forecasted_quantity']))

        forecastedPeriods.append({
            'period': periods[periodsLength - 1]['period'] + 1,
            'frequency': periods[0]['frequency'],
            'quantity': 0,
            'forecasted_quantity': lastPeriodForecasted,
            'difference': lastPeriodForecasted
        })

    return jsonify(forecastedPeriods), 200

@app.route('/method/minimos_cuadrados', methods=['POST'])
def minimos_cuadrados():
    data, xName, yName = request.json.values()

    forecastedData = []

    n = len(data)

    sum_x = 0
    sum_x_squared = 0
    sum_y = 0
    sum_y_squared = 0
    sum_xy = 0
    yAvg = 0
    xAvg = 0

    for record in data:
        xValue = record['xValue']
        yValue = record['yValue']

        sum_x += xValue
        sum_x_squared += xValue**2
        sum_y += yValue
        sum_y_squared += yValue**2
        sum_xy += xValue*yValue

    xAvg = sum_x / n
    yAvg = sum_y / n

    _SCx = sum_x_squared - (sum_x**2 / n)
    _SCy = sum_y_squared - (sum_y**2 / n)
    _SCxy = sum_xy - (
        (sum_x * sum_y) / n
    )

    b_1 = _SCxy / _SCx
    b_0 = yAvg - b_1*xAvg

    def fn(x): return b_0+b_1*x

    for record in data: 
        forecastedData.append({
            'xValue': record['xValue'],
            'yValue': record['yValue'],
            'yForecasted': fn(record['xValue'])
        })


    return jsonify({
        'xName': xName,
        'yName': yName,
        'forecastedData': forecastedData,
        'generatedFunction': f"{b_0}{b_1 if b_1 < 0 else f"+{b_1}"}x",
        'correlation': b_1*math.sqrt((_SCx/_SCy))
    }), 200



def getPeriodWeights(periodsToWorkWith):
    match periodsToWorkWith:
        case 2:
            return [0.5, 0.5]
        case 3: 
            return [0.25, 0.25, 0.5]
        case 4: 
            return [0.20, 0.20, 0.25, 0.35]
        case 5: 
            return [0.10, 0.10, 0.15, 0.25, 0.4]
        case 6: 
            return [0.05, 0.05, 0.1, 0.15, 0.25, 0.4]