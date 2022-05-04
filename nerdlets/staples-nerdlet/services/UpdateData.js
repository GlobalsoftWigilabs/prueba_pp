import {
    AccountStorageMutation,
    AccountsQuery,
    AccountStorageQuery
} from 'nr1';
import { NerdGraphQuery } from 'nr1';
import TouchPoints from "../config/touchPoints.json";
import Capacity from "../config/capacity.json";

export default class UpdateData {
    constructor(stages,version) {
        this.stages = stages;
        this.version = version;
        this.accountId = null;
        this.loading = false;
        this.graphQlmeasures = [];
        this.touchPoints = TouchPoints;
        this.capacity = Capacity;
        this.city = 0;
        this.capacityUpdatePending = false;
        this.stepsByStage = this.getStepsByStage();
        this.getAccountId();
    }

    async startUpdate(timeRange, city, getOldSessions) {
        if (this.accountId == null) {
            return;
        }
     //   console.log("Oldsession:", getOldSessions);
        this.loading = true;
        // CALL API FETCH LEVELS
        this.timeRange = timeRange;
        this.city = city;
        this.getOldSessions = getOldSessions;
        await this.touchPointsUpdate(1); //stage1
        await this.touchPointsUpdate(2); //stage2
        await this.touchPointsUpdate(3); //stage3
        await this.touchPointsUpdate(4); //stage4
        await this.touchPointsUpdate(5); //stage5
        this.calculateUpdates();
        this.updateMaxCapacity();
        this.loading = false;
        //console.log(this.touchPoints);
       // console.log('finish updates.');
    }

    getAccountId() {
        let accountId = null;
        AccountsQuery.query()
            .then(({ data }) => {
                accountId = data[0].id; 
                this.accountId = accountId;
                //this.accountId = 1847652;
                console.log("AccountID:", this.accountId);
               this.checkVersion();
                //this.setDBmaxCapacity();  // Uncomment to RESET with JSON values, comment the next line
                this.getDBmaxCapacity();
            })
            .catch((err) => {
                console.log(err);
            });
    }

    checkVersion(){
        // Read a document
        AccountStorageQuery.query({
            accountId: this.accountId,
            collection: 'pp',
            documentId: 'version',
        }).then(({ data }) => {
            if (data != null) {
                // IF data Exist
                console.log('READ STORAGE VERSION');
                if(data.Version != this.version){
                    this.setStorageTouchpoints();
                    this.setVersion();
                    this.setTouchpointsStatus();
                }else{
                    this.getStorageTouchpoints();
                }
            } else {
                this.setVersion();
            }
        });
    }

    setVersion(){
        // Write a document
        AccountStorageMutation.mutate({
            accountId: this.accountId,
            actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
            collection: 'pp',
            documentId: 'version',
            document: {
                Version: this.version
            },
        }).then(({ data }) => {
            console.log('SAVE VERSION TO STORAGE');
            console.log(data.nerdStorageWriteDocument.Version);
        });
    }

    getStorageTouchpoints(){
        // Read a document
        AccountStorageQuery.query({
            accountId: this.accountId,
            collection: 'pp',
            documentId: 'touchpoints',
        }).then(({ data }) => {
            if (data != null) {
                // IF data Exist
                //console.log('READ STORAGE TOUCHPOINTS');
                this.touchPoints = data.TouchPoints;
                this.setTouchpointsStatus();
            } else {
                this.setStorageTouchpoints();
            }
        });   
    }

    setStorageTouchpoints(){
        // Write a document
        AccountStorageMutation.mutate({
            accountId: this.accountId,
            actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
            collection: 'pp',
            documentId: 'touchpoints',
            document: {
                TouchPoints: this.touchPoints
            },
        }).then(({ data }) => {
            //console.log('SAVE TOUCHPOINTS TO STORAGE');
            //console.log(data.nerdStorageWriteDocument.TouchPoints);
        });
    }

    getDBmaxCapacity() {
        // Read a document
        AccountStorageQuery.query({
            accountId: this.accountId,
            collection: 'pp',
            documentId: 'maxCapacity',
        }).then(({ data }) => {
            if (data != null) {
                // IF data Exist
               // console.log('READ MAX CAPACITY');
                this.capacity = data.Capacity;
            } else {
                this.setDBmaxCapacity();
            }
        });
    }

    setDBmaxCapacity() {
        // Write a document
        AccountStorageMutation.mutate({
            accountId: this.accountId,
            actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
            collection: 'pp',
            documentId: 'maxCapacity',
            document: {
                Capacity: this.capacity
            },
        }).then(({ data }) => {
            console.log('SAVE MAX CAPACITY');
            //console.log(data.nerdStorageWriteDocument.Capacity);
        });
    }

    setTouchpointsStatus(){
        this.touchPoints.forEach(element => {
            if (element.index == this.city) {
                element.touchpoints.forEach(touchpoint => {
                    this.updateTouchpointStatus(touchpoint);
                });
            }
        });
    }

    updateTouchpointStatus(touchpoint){
        this.stages.some(stage=>{
            if(stage.index==touchpoint.stage_index){
                stage.touchpoints.some(tp=>{
                    if(tp.index==touchpoint.touchpoint_index){
                        tp.status_on_off = touchpoint.status_on_off;
                        return true;
                    }
                });
                return true;
            }
        });
    }    

    checkMaxCapacity(currentValue, stage) {
        let timeRange = this.timeRange.replaceAll(" ", "_");
        for (const [key, value] of Object.entries(this.capacity[this.city])) {
            if (key == timeRange) {
                var result = Math.max(value[stage], currentValue);
                if (value[stage] < currentValue) {
                    console.log("READY-TO-UPDATE-CAPACITY")
                    this.capacityUpdatePending = true;
                    value[stage] = currentValue * 2;
                }
                return result;
            }
        }
        return currentValue;
    }

    updateMaxCapacity() {
        if (this.capacityUpdatePending) {
            this.capacityUpdatePending = false;
            this.setDBmaxCapacity();
        }
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

    async touchPointsUpdate(stage) {
        //console.log('touchPointsUpdate ==> Stage:' + stage + ' CityCode:' + this.city + ' TimeRange:' + this.timeRange);
        this.graphQlmeasures.length = 0; // clear the ARRAY
        this.touchPoints.forEach(element => {
            if (element.index == this.city) {
                element.touchpoints.forEach(touchpoint => {
                    if (touchpoint.stage_index == stage && touchpoint.status_on_off) {
                        touchpoint.measure_points.forEach(measure => {
                            this.fetchMeasure(measure);
                        });
                    }
                });
            }
        });
        await this.nrdbQuery();
        // console.log(this.touchPoints[4].touchpoints[9].measure_points[0]);
    }



    fetchMeasure(measure) {
        if (measure.type == 0) {
            let query = "SELECT count(*),percentage(count(*), WHERE error is true) as percentage"
                + " FROM " + measure.query
                + " SINCE " + this.timeRangeTransform(this.timeRange, false);
            //console.log(query);
            this.graphQlmeasures.push([measure, query]);
        } else if (measure.type == 1) {
            let query = "SELECT apdex(duration, t: " + measure.apdex_time + ")"
                + " FROM " + measure.query
                + " SINCE " + this.timeRangeTransform(this.timeRange, false);
            this.graphQlmeasures.push([measure, query]);
            //console.log(query); 
        } else if (measure.type == 2) {
            let query = "SELECT uniqueCount(session) as session"
                + " FROM " + measure.query
                + " SINCE " + this.timeRangeTransform(this.timeRange, false);
            this.graphQlmeasures.push([measure, query]);
            //console.log(query); 
        } else if (measure.type == 3) {
            let query = "SELECT count(*)"
            +   + " FROM " + measure.query
                + " FACET session LIMIT MAX"
                + " SINCE " + this.timeRangeTransform(this.timeRange, true);
            this.graphQlmeasures.push([measure, query]);
        }
    }

    
    async nrdbQuery() {
        let gql = `{
            actor {`;
        let alias = '';
        let n = 0;
        this.graphQlmeasures.forEach(nrql => {
            alias = 'measure_' + n;
            n += 1;
            gql += `${alias}: account(id: ${this.accountId}) {
                nrql(query: "${nrql[1]}") {
                    results
                }
            }`;
        });
        gql += `}}`;
        if (n == 0) { return 0 } // SI no hay querys NO hace la llamada al GraphQL
        //console.log(gql);
        const { data, error } = await NerdGraphQuery.query({ query: gql });
        if (error) {
            console.log('Nerdgraph Error:', error);
        }
        // Set the values
        //console.log(data);
        let total_count = 0;
        for (const [key, value] of Object.entries(data.actor)) {
            var c = key.split("_");
            if (c[0] == 'measure') {
                var measure = this.graphQlmeasures[Number(c[1])][0];
                if (measure.type == 0 && value.nrql != null) {
                    measure.count = value.nrql.results[0].count;
                    total_count += measure.count;
                    measure.error_percentage = value.nrql.results[0].percentage == null ? 0 : value.nrql.results[0].percentage;
                } else if (measure.type == 1 && value.nrql != null) {
                    //console.log("APDEX:", value.nrql.results[0].score);
                    if (value.nrql.results[0].count > 0) {
                        measure.apdex = value.nrql.results[0].score;
                    } else {
                        measure.apdex = 1;
                    }
                } else if (measure.type == 2 && value.nrql != null) {
                    measure.count = value.nrql.results[0].session;
                    //console.log("SessionCount:",measure.count);
                } else if (measure.type == 3 && value.nrql != null) {
                    //console.log("Sesions:",value.nrql.results);
                    this.setSessions(measure, value.nrql.results);
                }
            }
        }
        //console.log("TOTAL-COUNT=" + total_count);
    }

    setSessionTime(measure_sessions, sessionID) {
        let session_time = Math.floor(Date.now() / 1000);
        if (this.getOldSessions) {
            session_time = session_time - 5 * 58; // 5min-10seg
        }
        measure_sessions.some(m_sess => {
            if (m_sess.id == sessionID) {
                session_time = m_sess.time;
                return true;
            }
        });
        return session_time;
    }

    setSessions(measure, sessions) {
        let new_sessions = [];
        sessions.forEach(session => {
            new_sessions.push(
                {
                    "id": session.facet,
                    "time": this.setSessionTime(measure.sessions, session.facet)
                }
            );
        });
        measure.sessions = new_sessions;
        //console.log("Sesions:",measure.sessions);
    }

    calculateUpdates() {
        //console.log("Calculate Updates");
        this.clearTouchpointError();
        this.touchPoints.forEach(element => {
            if (element.index == this.city) {
                this.countryCalculateUpdates(element);
            }
        });
    }

    getSessionsPercentage(sessions) {
        if (sessions.length == 0) {
            return 0;
        }
        let count = 0;
        let currentTime = Math.floor(Date.now() / 1000);
        sessions.forEach(session => {
            if ((currentTime - session.time) > 5 * 60) {
                count++;
            }
        });
        return count / sessions.length;
    }

    getmeasures(element) {
        let total_count = 0;
        let count_by_stage = [0, 0, 0, 0, 0];
        let sessions_by_stage = [0, 0, 0, 0, 0];
        let session_percentage_by_stage = [0, 0, 0, 0, 0];
        let apdex_by_stage = [1, 1, 1, 1, 1];
        let min_apdex_touchpoint_index_by_stage = [0, 0, 0, 0, 0];
        element.touchpoints.forEach(touchpoint => {
            if (touchpoint.status_on_off) {
                touchpoint.measure_points.forEach(measure => {
                    if (measure.type == 0) {
                        total_count += measure.count;
                        count_by_stage[touchpoint.stage_index - 1] += measure.count;
                    } else if (measure.type == 1) {
                        if (apdex_by_stage[touchpoint.stage_index - 1] > measure.apdex) {
                            apdex_by_stage[touchpoint.stage_index - 1] = measure.apdex;
                            min_apdex_touchpoint_index_by_stage[touchpoint.stage_index - 1] = touchpoint.touchpoint_index;
                        }
                    } else if (measure.type == 2) {
                        sessions_by_stage[touchpoint.stage_index - 1] += measure.count;
                    } else if (measure.type == 3) {
                        session_percentage_by_stage[touchpoint.stage_index - 1] = this.getSessionsPercentage(measure.sessions);
                    }
                });
            }
        });
        return {
            "total_count": total_count,
            "count_by_stage": count_by_stage,
            "sessions_by_stage": sessions_by_stage,
            "session_percentage_by_stage": session_percentage_by_stage,
            "apdex_by_stage": apdex_by_stage,
            "min_apdex_touchpoint_index_by_stage": min_apdex_touchpoint_index_by_stage
        }
    }

    countryCalculateUpdates(element) {
        let values = this.getmeasures(element);
        //console.log("total-use=" + values.total_count);
        let totalUse = values.total_count;
        totalUse = totalUse == 0 ? 1 : totalUse;
        for (let i = 0; i < this.stages.length; i++) { // for Each Stage
            this.stages[i].status_color = 'good';
            // SET color for error condition
            this.stages[i].status_color = this.updateErrorCondition(this.stages[i].status_color, this.getStageError(i + 1, element));
            //------------------------------
            this.stages[i].total_count = values.count_by_stage[i];
            this.stages[i].congestion.value = Math.round(values.count_by_stage[i] / totalUse * 10000) / 100;

            this.stages[i].capacity = values.count_by_stage[i] / this.checkMaxCapacity(values.count_by_stage[i], i) * 100;

            // Check Congestion according to response speed
            this.stages[i].congestion.percentage = (1 - values.apdex_by_stage[i]) * 100;

            //Change the total_count according to Sessions
            if (i == 1 || i == 2 || i == 4) {
                this.stages[i].total_count = values.sessions_by_stage[i];
                this.stages[i].congestion.value = Math.round(values.session_percentage_by_stage[i] * 10000) / 100;
            }


        }
        this.updateMaxLatencySteps(values.min_apdex_touchpoint_index_by_stage);

    }

    updateMaxLatencySteps(max_duration_touchpoint_index_by_stage) {
        for (let i = 0; i < this.stages.length; i++) { // for Each Stage
            this.stages[i].steps.forEach(step => {
                step.sub_steps.forEach(sub_step => {
                    sub_step.latency = false;
                    sub_step.relationship_touchpoints.forEach(touchPointIndex => {
                        if (touchPointIndex == max_duration_touchpoint_index_by_stage[i]) {
                            sub_step.latency = true;
                        }
                    });
                });
            });
        }
    }

    updateErrorCondition(actual, nextvalue) {
        if (actual == 'danger') { return actual; }
        if (nextvalue == 'danger') { return nextvalue; }
        if (actual == 'warning') { return actual; }
        if (nextvalue == 'warning') { return nextvalue; }
        return actual;
    }

    getStepsByStage() {
        let reply = [];
        let idx = 0;
        this.stages.forEach(stage => {
            idx = stage.steps[stage.steps.length - 1].sub_steps.length - 1;
            reply.push(stage.steps[stage.steps.length - 1].sub_steps[idx].index);
        });
        return reply;
    }

    getTotalStepsWithError(steps_with_error) {
        let count = 0;
        let i = 0;
        while (i < steps_with_error.length) {
            count += steps_with_error[i];
            i++;
        }
        return count;
    }

    getStageError(stage, element) {
        let error_touchpoints = 0;
        let count_touchpoints = 0;
        let steps_with_error = [];
        while (steps_with_error.length < this.stepsByStage[stage - 1]) {
            steps_with_error.push(0);
        }
        element.touchpoints.forEach(touchpoint => {
            if (touchpoint.stage_index == stage && touchpoint.status_on_off) {
                count_touchpoints += 1;
                touchpoint.measure_points.forEach(measure => {
                    if (measure.type == 0) {
                        if (measure.error_percentage > measure.error_threshold) {
                            error_touchpoints += 1;
                            measure.relation_steps.forEach(rel => {
                                steps_with_error[rel - 1] = 1;
                            });
                            this.setTouchpointError(touchpoint.stage_index, touchpoint.touchpoint_index);
                        }
                    } else if (measure.type == 1) {
                        if (measure.apdex < 0.4) {
                            measure.relation_steps.forEach(rel => {
                                steps_with_error[rel - 1] = 1;
                            });
                            this.setTouchpointError(touchpoint.stage_index, touchpoint.touchpoint_index);
                        }
                    }
                });
            }
        });
        if (count_touchpoints > 0) {
            let porcentage = this.getTotalStepsWithError(steps_with_error) / this.stepsByStage[stage - 1];
            //let porcentage = error_touchpoints / count_touchpoints;
            if (porcentage >= 0.5) {
                return 'danger';
            }
            if (porcentage >= 0.15) {
                return 'warning';
            }
            return 'good';
        } else {
            return 'good';
        }
    }

    setTouchpointError(stage_index, touchpoint_index) {
        this.stages[stage_index - 1].touchpoints.forEach(touchpoint => {
            if (touchpoint.index == touchpoint_index) {
                touchpoint.error = true;

            }
        });
        this.stages[stage_index - 1].steps.forEach(step => {
            if ("relationship_touchpoints" in step) {
                step.relationship_touchpoints.forEach(value => {
                    if (value == touchpoint_index) {
                        step.error = true;
                    }
                });
            } else {
                step.sub_steps.forEach(sub_step => {
                    sub_step.relationship_touchpoints.forEach(value => {
                        if (value == touchpoint_index) {
                            sub_step.error = true;
                        }
                    });
                });
            }

        });
    }

    // remove all the touchpoins error before to calculate again
    clearTouchpointError() {
        for (let i = 0; i < this.stages.length; i++) {
            this.stages[i].touchpoints.forEach(touchpoint => {
                touchpoint.error = false;
            });
            this.stages[i].steps.forEach(step => {
                step.sub_steps.forEach(sub_step => {
                    sub_step.error = false;
                });
            });
        }
    }

    updateTouchpointOnOff(touchpoint) {
        this.touchPoints.some(element => {
            if (element.index == this.city) {
                element.touchpoints.some(tp => {
                    if (tp.stage_index == touchpoint.stage_index && tp.touchpoint_index == touchpoint.index) {
                        tp.status_on_off = touchpoint.status_on_off;
                        console.log("ACTUALIZANDO:", tp.stage_index, ":", tp.touchpoint_index, ":", tp.status_on_off);
                        this.setStorageTouchpoints();
                        return true;
                    }
                });
                return true;
            }
        });
    }

    getTouchpointStatusOnOff(touchpoint){
        let touchpoint_status = false;
        this.touchPoints.some(element => {
            if (element.index == this.city) {
                element.touchpoints.some(tp => {
                    if (tp.stage_index == touchpoint.stage_index && tp.touchpoint_index == touchpoint.index) {
                        touchpoint_status = tp.status_on_off;
                        //console.log("GET_touchpoint_status:", tp.stage_index, ":", tp.touchpoint_index, ":", tp.status_on_off);
                        return true;
                    }
                });
                return true;
            }
        });
        return touchpoint_status;
    }

    getTouchpointTune(touchpoint){
        let datos = null;
        this.touchPoints.some(element => {
            if (element.index == this.city) {
                element.touchpoints.some(tp => {
                    if (tp.stage_index == touchpoint.stage_index && tp.touchpoint_index == touchpoint.index) {
                        datos = {
                            error_threshold: tp.measure_points[0].error_threshold,
                            apdex_time: tp.measure_points[1].apdex_time
                        }
                        return true;
                    }
                });
                return true;
            }
        });
        return datos;
    }

    updateTouchpointTune(touchpoint,datos) {
        this.touchPoints.some(element => {
            if (element.index == this.city) {
                element.touchpoints.some(tp => {
                    if (tp.stage_index == touchpoint.stage_index && tp.touchpoint_index == touchpoint.index) {
                        tp.measure_points[0].error_threshold = datos.error_threshold;
                        tp.measure_points[1].apdex_time = datos.apdex_time;
                        this.setStorageTouchpoints();
                        return true;
                    }
                });
                return true;
            }
        });
    }

    getTouchpointQuerys(touchpoint){
        let datos = null;
        this.touchPoints.some(element => {
            if (element.index == this.city) {
                element.touchpoints.some(tp => {
                    if (tp.stage_index == touchpoint.stage_index && tp.touchpoint_index == touchpoint.index) {
                        if(tp.measure_points.length>2){
                            datos = [
                                {
                                    label: "Count Query",
                                    value: 0,
                                    query_start: "SELECT count(*),percentage(count(*), WHERE error is true) as percentage FROM",
                                    query_body: tp.measure_points[0].query,
                                    query_footer: "SINCE "+ this.timeRangeTransform(this.timeRange, false)
                                },
                                {
                                    label: "Apdex Query",
                                    value: 1,
                                    query_start: "SELECT apdex(duration, t: " + tp.measure_points[1].apdex_time + ") FROM",
                                    query_body: tp.measure_points[1].query,
                                    query_footer: "SINCE "+ this.timeRangeTransform(this.timeRange, false)
                                },
                                {
                                    label: "Session Query",
                                    value: 2,
                                    query_start: "SELECT uniqueCount(session) as session FROM",
                                    query_body: tp.measure_points[2].query,
                                    query_footer: "SINCE "+ this.timeRangeTransform(this.timeRange, false)
                                }
                            ]
                        }else{
                            datos = [
                                {
                                    label: "Count Query",
                                    value: 0,
                                    query_start: "SELECT count(*),percentage(count(*), WHERE error is true) as percentage FROM",
                                    query_body: tp.measure_points[0].query,
                                    query_footer: "SINCE "+ this.timeRangeTransform(this.timeRange, false)
                                },
                                {
                                    label: "Apdex Query",
                                    value: 1,
                                    query_start: "SELECT apdex(duration, t: " + tp.measure_points[1].apdex_time + ") FROM",
                                    query_body: tp.measure_points[1].query,
                                    query_footer: "SINCE "+ this.timeRangeTransform(this.timeRange, false)
                                }
                            ]
                        }
                        return true;
                    }
                });
                return true;
            }
        });
        return datos;
    }

    updateTouchpointQuerys(touchpoint,datos) {
        this.touchPoints.some(element => {
            if (element.index == this.city) {
                element.touchpoints.some(tp => {
                    if (tp.stage_index == touchpoint.stage_index && tp.touchpoint_index == touchpoint.index) {
                        if(datos.length>2){
                            tp.measure_points[0].query = datos[0].query_body;
                            tp.measure_points[1].query = datos[1].query_body;
                            tp.measure_points[2].query = datos[2].query_body;
                        }else{
                            tp.measure_points[0].query = datos[0].query_body;
                            tp.measure_points[1].query = datos[1].query_body;
                        }
                        this.setStorageTouchpoints();
                        return true;
                    }
                });
                return true;
            }
        });
    }
}