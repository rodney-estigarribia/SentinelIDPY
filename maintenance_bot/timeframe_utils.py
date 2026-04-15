import datetime
import calendar

def generate_timeframe_options(target_date):
    """
    Genera un diccionario de opciones validas basadas en target_date.
    Retorna configs especificas para matomo_period, matomo_date, etc.
    """
    ty = target_date.year
    tm = target_date.month

    options = {}

    def dstr(d): return d.strftime("%Y-%m-%d")
    def last_day(y, m): return datetime.date(y, m, calendar.monthrange(y, m)[1])
    def first_day(y, m): return datetime.date(y, m, 1)

    # 1. Ultimos 30 dias
    start_30 = target_date - datetime.timedelta(days=30)
    prev_30_start = start_30 - datetime.timedelta(days=30)
    prev_30_end = start_30 - datetime.timedelta(days=1)
    options['last_30'] = {
        'label': 'Últimos 30 días',
        'matomo_period': 'range',
        'matomo_date': f"{dstr(start_30)},{dstr(target_date)}",
        'matomo_prev_date': f"{dstr(prev_30_start)},{dstr(prev_30_end)}",
        'wf_start': int(datetime.datetime.combine(start_30, datetime.time.min).timestamp()),
        'wf_end': int(datetime.datetime.combine(target_date, datetime.time.max).timestamp())
    }

    # Helper for full months
    def add_month_option(key, y, m, name):
        sMonth = first_day(y, m)
        eMonth = last_day(y, m)
        if sMonth > target_date: return # invalid future
        if eMonth > target_date: eMonth = target_date # truncate to today
        
        py, pm = (y, m-1) if m > 1 else (y-1, 12)
        psMonth = first_day(py, pm)
        peMonth = last_day(py, pm)
        
        options[key] = {
            'label': name,
            'matomo_period': 'month',
            'matomo_date': dstr(sMonth),
            'matomo_prev_date': dstr(psMonth),
            'wf_start': int(datetime.datetime.combine(sMonth, datetime.time.min).timestamp()),
            'wf_end': int(datetime.datetime.combine(eMonth, datetime.time.max).timestamp())
        }

    # Mes actual y anterior
    add_month_option('current_month', ty, tm, f"Mes Actual ({target_date.strftime('%B').capitalize()})")
    py, pm = (ty, tm-1) if tm > 1 else (ty-1, 12)
    add_month_option('prev_month', py, pm, 'Mes Anterior')

    # Trimestres (hasta 4 anteriores)
    # Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
    quarters = [
        (1, 3, 'Q1'), (4, 6, 'Q2'), (7, 9, 'Q3'), (10, 12, 'Q4')
    ]
    
    def add_quarter_option(y, q_idx):
        start_m, end_m, q_name = quarters[q_idx]
        sQ = first_day(y, start_m)
        eQ = last_day(y, end_m)
        if sQ > target_date: return

        # previous quarter
        pq_idx = q_idx - 1
        py_q = y
        if pq_idx < 0:
            pq_idx = 3
            py_q = y - 1
        psQ = first_day(py_q, quarters[pq_idx][0])
        peQ = last_day(py_q, quarters[pq_idx][1])
        
        if eQ > target_date: eQ = target_date

        key = f"Q_{y}_{q_name}"
        options[key] = {
            'label': f"{q_name} {y}",
            'matomo_period': 'range',
            'matomo_date': f"{dstr(sQ)},{dstr(eQ)}",
            'matomo_prev_date': f"{dstr(psQ)},{dstr(peQ)}",
            'wf_start': int(datetime.datetime.combine(sQ, datetime.time.min).timestamp()),
            'wf_end': int(datetime.datetime.combine(eQ, datetime.time.max).timestamp())
        }

    # current year + last year quarters
    for year in [ty, ty-1]:
        for q_idx in range(4):
             add_quarter_option(year, q_idx)

    # 6 Months (Current year H1 or H2)
    def add_half_year(y, h_idx):
        # h_idx 0 = H1 (Jan-Jun), 1 = H2 (Jul-Dec)
        start_m = 1 if h_idx == 0 else 7
        end_m = 6 if h_idx == 0 else 12
        sH = first_day(y, start_m)
        eH = last_day(y, end_m)
        if sH > target_date: return
        
        py_h = y if h_idx == 1 else y - 1
        ph_idx = 0 if h_idx == 1 else 1
        psH = first_day(py_h, 1 if ph_idx == 0 else 7)
        peH = last_day(py_h, 6 if ph_idx == 0 else 12)

        if eH > target_date: eH = target_date

        h_name = 'H1 (Ene-Jun)' if h_idx == 0 else 'H2 (Jul-Dic)'
        key = f"H_{y}_{h_idx}"
        options[key] = {
            'label': f"{h_name} {y}",
            'matomo_period': 'range',
            'matomo_date': f"{dstr(sH)},{dstr(eH)}",
            'matomo_prev_date': f"{dstr(psH)},{dstr(peH)}",
            'wf_start': int(datetime.datetime.combine(sH, datetime.time.min).timestamp()),
            'wf_end': int(datetime.datetime.combine(eH, datetime.time.max).timestamp())
        }
    
    for year in [ty, ty-1]:
        add_half_year(year, 0)
        add_half_year(year, 1)

    # 1 Year (from Jan to Dec)
    def add_year_option(y):
        sY = first_day(y, 1)
        eY = last_day(y, 12)
        if sY > target_date: return
        if eY > target_date: eY = target_date
        
        py_y = y - 1
        psY = first_day(py_y, 1)
        peY = last_day(py_y, 12)

        key = f"Y_{y}"
        options[key] = {
            'label': f"Año {y}",
            'matomo_period': 'year',
            'matomo_date': dstr(sY), # For year, period=year and date=any valid start date or exact 'year' param
            'matomo_prev_date': dstr(psY),
            'wf_start': int(datetime.datetime.combine(sY, datetime.time.min).timestamp()),
            'wf_end': int(datetime.datetime.combine(eY, datetime.time.max).timestamp())
        }

    add_year_option(ty)
    add_year_option(ty-1)

    return options
