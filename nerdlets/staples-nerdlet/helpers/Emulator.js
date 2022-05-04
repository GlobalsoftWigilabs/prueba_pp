/**
 * Clase helper para actualizar los datos al nerdlet
 */
export default class Emulator {

    constructor(data) {
        this.data = data;
        this.firstLoad = true;
    }

    init = () => {
        this._fetchLevels();
        this._fetchCapacities();
        this._fetchErrors();
        this.firstLoad = false;

        this.intervalLevel = setInterval(() => {
            this._fetchLevels();
        }, 3000);

        this.intervalCapacity = setInterval(() => {
            this._fetchCapacities();
        }, 3000);

        this.intervalErrors = setInterval(() => {
            this._fetchErrors();
        }, 10000);

        this.timeRange = "5 MINUTES AGO";
        this.getOldSessions = false;
    };

    getDataState = () => {
        return this.data;
    };

    closeConnections() {
        clearInterval(this.intervalLevel);
        clearInterval(this.intervalCapacity);
        clearInterval(this.intervalErrors);
    }

    _ramdomHighLight = () => {
        // const highlightOptions = Array(2).fill(false).push("red");
        const highlightOptions = [false, false, false, false, "red", false, false, false]
        return highlightOptions[Math.floor(Math.random() * highlightOptions.length)];
    };

    _randomIntFromInterval = (min, max, actualValue) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        let rand = Math.floor(Math.random() * (max - min + 1)) + min;
        let res = actualValue + rand - Math.round((max - min) / 2);
        if (res < 1) {
            return 1;
        } else if (res >= 100 && actualValue !== 0) {
            rand = Math.floor(Math.random() * (max - min + 1)) + min;
            res = (actualValue - rand) - (Math.round((max - min) / 2));
            return res;
        } else {
            return res;
        }
    };

    _randomInt = (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        let rand = Math.floor(Math.random() * (max - min + 1)) + min;
        return rand;
    };

    _randomWithArrayOfNumbers = (n, quantityNumbers) => {
        const arr = new Array(n);
        for (let i = 0; i < n; i++) {
            arr[i] = i + 1;
        }
        arr.sort(() => Math.random() > 0.5 ? 1 : -1);
        return arr.slice(0, quantityNumbers);
    }

    _fetchCapacities = () => {
        for (const stage of this.data) {
            let update = this.firstLoad ? true : (this._randomIntFromInterval(1, 25, 50) < 80 ? true : false);
            if (update) {
                if (stage.congestion.percentage > 80) {
                    stage.congestion.percentage = this._randomIntFromInterval(1, 15, Math.round(stage.congestion.percentage / 2));
                } else {
                    stage.congestion.percentage = this._randomIntFromInterval(1, 15, stage.congestion.percentage);;
                }
                stage.congestion.value = this._randomIntFromInterval(1, 20, stage.congestion.value);
                stage.total_count = Math.floor(Math.random() * (900000)) + 5000;
                if(stage.total_count<0){stage.total_count=0;}
                stage.capacity = this._randomIntFromInterval(1, 20, stage.capacity);
            }
        }
    };

    _fetchLevels = () => {
        for (const stage of this.data) {
            let update = this.firstLoad ? true : (this._randomIntFromInterval(1, 25, 50) < 80 ? true : false);
            if (update) {
                stage.level = this._randomIntFromInterval(1, 15, stage.level);
            }
        }
    };

    _fetchErrors = () => {
        let update = this.firstLoad ? true : (this._randomIntFromInterval(1, 25, 50) < 80 ? true : false);
        if (update) {
            for (const key in this.data) {
                let newSteps = [];
                let number = this._randomInt(1, 20);
                let exist = this.data[key].touchpoints.find(touchpoint => touchpoint.index === number);
                if (exist) {
                    this.resetSpecificStage(key);
                    this.data[key].touchpoints[exist.index - 1].error = true;
                    for (const step of this.data[key].steps) {
                        if (step.value === '') {
                            for (const substep of step.sub_steps) {
                                for (const relation of substep.relationship_touchpoints) {
                                    if (relation === exist.index) {
                                        substep.error = true;
                                    }
                                }
                            }
                            step.error = true;
                            step.sub_steps = step.sub_steps;
                        } else {
                            for (const relationS of step.relationship_touchpoints) {
                                if (relationS === exist.index) {
                                    step.error = true;
                                }
                            }
                        }
                        newSteps.push(step);
                    }
                    this.data[key].steps = newSteps;
                }
            }
        }
    }
    resetSpecificStage = (key) => {
        for (const step of this.data[key].steps) {
            if (step.value === '') {
                for (const substep of step.sub_steps) {
                    substep.error = false;
                }
                step.error = false;
            } else {
                step.error = false;
            }
        }
        for (const touch of this.data[key].touchpoints) {
            touch.error = false;
        }
    }
    // new funtions
    getTouchpointTune(touchpoint){
        let datos = null;
 
        datos = {
            error_threshold: 'test',
            apdex_time: '5m'
        }

        return datos;
    }
    
    
    getTouchpointQuerys(touchpoint){
        let datos = null;
        datos = [
            {
                label: "Count Query",
                value: 0,
                query_start: "SELECT count(*),percentage(count(*), WHERE error is true) as percentage FROM",
                query_body: "SELECT count(*),percentage(count(*), WHERE error is true) as percentage FROM SINCE " + this.timeRangeTransform(this.timeRange, false),
                query_footer: "SINCE "+ this.timeRangeTransform(this.timeRange, false)
            },
            {
                label: "Apdex Query",
                value: 1,
                query_start: "SELECT apdex(duration, t: 1) FROM",
                query_body: "SELECT apdex(duration, t: 1) FROM SINCE" + this.timeRangeTransform(this.timeRange, false),
                query_footer: "SINCE "+ this.timeRangeTransform(this.timeRange, false)
            }
        ]
        return datos;
    }

    timeRangeTransform(timeRange, sessionsRange) {
        let time_start = 0;
        let time_end = 0;
        if (timeRange == "5 MINUTES AGO") {
            if (sessionsRange && this.getOldSessions) {
                time_start = Math.floor(Date.now() / 1000) - 10 * 59; // 10min-10seg
                time_end = Math.floor(Date.now() / 1000) - 5 * 58; // 5min - 10seg
                return time_start + ' UNTIL ' + time_end;
            }
            return timeRange;
        }
        switch (timeRange) {
            case "30 MINUTES AGO":
                time_start = Math.floor(Date.now() / 1000) - 40 * 60;
                time_end = Math.floor(Date.now() / 1000) - 30 * 60;
                break;
            case "60 MINUTES AGO":
                time_start = Math.floor(Date.now() / 1000) - 70 * 60;
                time_end = Math.floor(Date.now() / 1000) - 60 * 60;
                break;
            case "3 HOURS AGO":
                time_start = Math.floor(Date.now() / 1000) - 3 * 60 * 60 - 10 * 60;
                time_end = Math.floor(Date.now() / 1000) - 3 * 60 * 60;
                break;
            case "6 HOURS AGO":
                time_start = Math.floor(Date.now() / 1000) - 6 * 60 * 60 - 10 * 60;
                time_end = Math.floor(Date.now() / 1000) - 6 * 60 * 60;
                break;
            case "12 HOURS AGO":
                time_start = Math.floor(Date.now() / 1000) - 12 * 60 * 60 - 10 * 60;
                time_end = Math.floor(Date.now() / 1000) - 12 * 60 * 60;
                break;
            case "24 HOURS AGO":
                time_start = Math.floor(Date.now() / 1000) - 24 * 60 * 60 - 10 * 60;
                time_end = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
                break;
            case "3 DAYS AGO":
                time_start = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60 - 10 * 60;
                time_end = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60;
                break;
            case "7 DAYS AGO":
                time_start = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60 - 10 * 60;
                time_end = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60;
                break;
            default:
                return timeRange;
        }
        if (sessionsRange && this.getOldSessions) {
            time_start = time_start - 10 * 59;
            time_end = time_end - 5 * 58;
        }
        return time_start + ' UNTIL ' + time_end;
    }
}