from flask import Flask, request, jsonify
from flask import render_template

app = Flask(__name__)

@app.route('/')
def index():  
    return render_template('index.html')

@app.route('/method/<method>')
def method(method):

    method = method.split('_')

    method = [word.capitalize() for word in method]

    method = ' '.join(method)

    return render_template('movil_simple.html', method=method)

@app.route('/method/promedio_simple', methods=['POST'])
def promedioSimple():
    periods, periodsToWorkWith = request.json.values()
    forecastedPeriods = []

    print(periods)

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