import sys
import json
import pandas as pd
import matplotlib.pyplot as plt
import io
import base64
from datetime import datetime, timedelta

def analyze_cycle(data):
    try:
        # Extract input data
        # 'history' should be a list of objects with 'period_start'
        history = data.get('history', [])
        avg_cycle_length = int(data.get('avg_cycle_length', 28))
        
        # Sort history by date descending
        history.sort(key=lambda x: x['period_start'], reverse=True)
        
        if not history:
             return {"error": "No cycle history found"}

        last_period_date_str = history[0]['period_start']
        last_period_date = datetime.strptime(last_period_date_str, '%Y-%m-%d')
        
        # Calculate average cycle length from history if enough data exists
        calculated_avg = avg_cycle_length
        if len(history) >= 2:
            cycles = []
            for i in range(len(history) - 1):
                d1 = datetime.strptime(history[i]['period_start'], '%Y-%m-%d')
                d2 = datetime.strptime(history[i+1]['period_start'], '%Y-%m-%d')
                diff = (d1 - d2).days
                if 20 <= diff <= 45: # Filter reasonable cycle lengths
                    cycles.append(diff)
            
            if cycles:
                calculated_avg = sum(cycles) // len(cycles)

        # Create a plot: Cycle Phase Distribution
        # Follicular: 1-13 (varies), Ovulation: 14 (approx), Luteal: 15-28 (fixed 14 typically)
        
        luteal_length = 14
        ovulation_day = calculated_avg - luteal_length
        follicular_length = ovulation_day - 1 # Days before ovulation
        
        phases = ['Menstruation', 'Follicular', 'Ovulation', 'Luteal']
        lengths = [5, follicular_length - 5, 1, luteal_length] # Assuming 5 days period
        
        # Ensure non-negative
        lengths = [max(1, x) for x in lengths]

        colors = ['#FF9AA2', '#FFB7B2', '#FFDAC1', '#E2F0CB']
        
        fig, ax = plt.subplots(figsize=(8, 6))
        wedges, texts, autotexts = ax.pie(lengths, labels=phases, autopct='%1.1f%%', 
                                          startangle=90, colors=colors, textprops=dict(color="black"))
        
        ax.set_title(f'Cycle Phase Distribution ({calculated_avg} Days Avg)')
        
        # Save plot to base64
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', bbox_inches='tight')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.read()).decode('utf-8')
        plt.close()
        
        # Predictions
        future_dates = []
        current = last_period_date
        for i in range(3):
            next_date = current + timedelta(days=calculated_avg)
            future_dates.append(next_date.strftime('%Y-%m-%d'))
            current = next_date
            
        return {
            "status": "success",
            "cycle_length": calculated_avg,
            "next_predicted_periods": future_dates,
            "phase_plot": f"data:image/png;base64,{img_base64}"
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    try:
        # Read input from stdin
        input_str = sys.stdin.read()
        if not input_str:
             # Fallback for manual testing if no input provided
            print(json.dumps({"error": "No input data provided"}))
            sys.exit(1)
            
        data = json.loads(input_str)
        result = analyze_cycle(data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
