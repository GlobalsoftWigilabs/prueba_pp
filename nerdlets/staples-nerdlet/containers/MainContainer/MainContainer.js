import React from "react";
import Stage from "../../components/Stage/Stage.js";
import Header from "../../components/Header/Header.js";
import StepContainer from "../StepContainer/StepContainer.js";
import TouchPointContainer from "../TouchPointContainer/TouchPointContainer.js";
import { nerdlet } from "nr1";
import medalIconOn from "../../images/medalIconOn.svg";
import medalIcon from "../../images/medalIcon.svg";
import startIcon from "../../images/StartIcon.svg";
import startIconOn from "../../images/StartIconOn.svg";
import goutBlack from "../../images/goutBlack.svg";
import Modal from "../../components/Modal";
import UpdateData from "../../services/UpdateData";
import Setup from "../../config/setup.json";
import StorageUpdate from "../../services/StorageUpdate";
import AppContext from "../../Provider/AppProvider";

import { Modal as Moque, Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import moment from "moment";
import setHours from "date-fns/setHours";
import setMinutes from "date-fns/setMinutes";
import Version from '../../../../package.json';

/**
 *Main container component
 *
 * @export
 * @class MainContainer
 * @extends {React.Component}
 */
export default class MainContainer extends React.Component {
  constructor(props) {
    super(props);
    nerdlet.setConfig({
      header: false,
    });
    this.state = {
      stages: null,
      iconFireStatus: false,
      iconStartStatus: false,
      iconGoutStatus: false,
      iconCanaryStatus: false,
      iconSixthSenseStatus: false,
      hidden: false,
      stageNameSelected: "",
      viewModal:0,
      checkMoney: false,
      city: 0,
      timeRange: "5 MINUTES AGO",
      getOldSessions: true,
      loading: false,
      canaryData: null,
      colors: null,
      tune: null,
      tuneOptions: null,
      checkAllStatus: false,
      customTimePicker: false,
      renderDay: null,
      startDate: new Date(),
      endDate: new Date(),
      diffDate: "",
      selectionDate: true,
      selectionDateStart: true,
      visible: false,
      idVisible: "",
      version: "0.0.0",
      backdrop: false,
      emulatorActive: false
    };
  }

  updateDataNow() {
    console.log('UPDATE-NOW');
    this.setState({ loading: true });
    if (!this.updateData.loading) {
      let { timeRange, city, getOldSessions } = this.state;
      //console.log('goto updater');
      this.updateData.startUpdate(timeRange, city, getOldSessions).then(() => {
        //console.log('show updates');
        this.setState({ getOldSessions: false });
        this.setState({ stages: this.state.stages });
        this.setState({ loading: false });
      });
    } else {
      setTimeout(() => {
        this.updateDataNow();
      }, 1000);
    }
  }

  componentWillMount() {
    const { state } = this.context;
    const { stages, colors, countrys, tune } = state;
    this.state.stages = stages;
    this.state.colors = colors;
    this.state.countrys = countrys;
    this.state.tune = tune;
    this.state.version = Version.version;
    this.updateData = new UpdateData(this.state.stages,this.state.version);
    this.StorageCanary = new StorageUpdate(); //activa data canary
    setTimeout(() => {
      let { timeRange, city, getOldSessions } = this.state;
      this.updateData.startUpdate(timeRange, city, getOldSessions).then(() => {
        console.log('show updates');
        this.setState({ getOldSessions: false });
        this.setState({ stages: this.state.stages });
      });
    }, 1500);

  }

  componentDidMount() {
    this.interval = setInterval(() => {
      if (!this.updateData.loading) {
        let { timeRange, city, getOldSessions } = this.state;
        console.log('goto updater');
        this.updateData.startUpdate(timeRange, city, getOldSessions).then(() => {
          console.log('show updates');
          this.setState({ getOldSessions: false });
          this.setState({ stages: this.state.stages });
        });
      }
    }, Setup.time_refresh);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  // ===========================================================
  onClickStage = (stageIndex) => {
    //console.log("StageonCLick:",stageIndex);
    this.state.stages[stageIndex - 1].latencyStatus = !this.state.stages[
      stageIndex - 1
    ].latencyStatus;
    this.setState({ stages: this.state.stages });
  };

  onclickStep = (stepEntry) => {
    const { stages, iconFireStatus, iconCanaryStatus, canaryData } = this.state;
    if (iconFireStatus) {
      this.resetAllStages();
    }

    let touchpoin = [];
    let newStages = [];
    let flag = false;
    let stage = stages[stepEntry.index_stage - 1];
    for (const step of stage.steps) {
      if (step.value === "") {
        for (const substep of step.sub_steps) {
          if (substep.value === stepEntry.value) {
            flag = substep.highlighted;
            substep.highlighted = !substep.highlighted;
            //console.log('1.-' + substep.value);
            if (iconCanaryStatus) {
              //substep.canary_state = true;
              substep.canary_state = substep.canary_state ? false : true;

              //aca actualizo el nnuevo array -- aun no se como guardar el proceso SUBSTEP
              canaryData[substep.index_stage - 1].states[substep.index - 1] =
                substep.canary_state;
              this.StorageCanary.update(canaryData);
              //actulizamos el nuevo array
              //console.log(substep);
              //console.table(canaryData[substep.index_stage - 1].states[substep.index - 1]);
            }

            for (const id_touchpoint of substep.relationship_touchpoints) {
              touchpoin.push(id_touchpoint);
            }
          } else {
            substep.highlighted = false;
          }
        }
      } else {
        if (step.value === stepEntry.value) {
          flag = step.highlighted;
          step.highlighted = !step.highlighted;
          //console.log('3.-' + step.value);
          if (iconCanaryStatus) {
            step.canary_state = step.canary_state ? false : true;

            //aca actualizo el nnuevo array -- aun no se como guardar el proceso SUBSTEP
            canaryData[step.index_stage - 1].states[step.index - 1] =
              step.canary_state;
            this.StorageCanary.update(canaryData);
            //actulizamos el nuevo array
            //console.log(stepEntry);
            //console.table(canaryData[step.index_stage - 1].states[step.index - 1]);
          }
          for (const id_touchpoint of step.relationship_touchpoints) {
            touchpoin.push(id_touchpoint);
          }
        } else {
          step.highlighted = false;
        }
      }
    }
    for (const key in stage.touchpoints) {
      stage.touchpoints[key].highlighted = false;
    }
    if (!flag) {
      if (touchpoin.length !== 0) {
        for (const id_to of touchpoin) {
          for (const key in stage.touchpoints) {
            if (stage.touchpoints[key].index === id_to) {
              stage.touchpoints[key].highlighted = !stage.touchpoints[key]
                .highlighted;
            }
          }
        }
      }
    }
    for (const iterator of stages) {
      if (iterator.title !== stage.title) {
        newStages.push(iterator);
      } else {
        newStages.push(stage);
      }
    }
    this.setState({ stages: newStages, iconFireStatus: false });
  };

  resetAllStages = () => {
    const { stages } = this.state;
    //unselect all steps and touchpoints
    for (const stage of stages) {
      for (const step of stage.steps) {
        if (step.value === "") {
          for (const substep of step.sub_steps) {
            substep.history_error = false;
            substep.highlighted = false;
          }
          step.history_error = false;
          step.highlighted = false;
        } else {
          step.history_error = false;
          step.highlighted = false;
        }
      }
      for (const touch of stage.touchpoints) {
        touch.highlighted = false;
        touch.history_error = false;
      }
    }
    this.setState({ stages });
  };

  checkMoneyBudget = () => {
    let { checkMoney, stages, iconStartStatus } = this.state;
    let newData = [];
    for (const stage of stages) {
      stage.money_enabled = !checkMoney;
      stage.icon_visible = iconStartStatus;
      newData.push(stage);
    }
    this.setState({
      stages: newData,
      checkMoney: !checkMoney,
    });
  };

  _onClose = () => {
    let actualValue = this.state.hidden;
    this.setState({ hidden: !actualValue });
    this.restoreTouchPoints();
  };
  preSelectCanaryData = (canaryData) => {
    const { stages } = this.state;
    for (const stage of stages) {
      for (const step of stage.steps) {
        if (step.value === "") {
          for (const substep of step.sub_steps) {
            substep.canary_state =
              canaryData[substep.index_stage - 1].states[substep.index - 1];
          }
        } else {
          step.canary_state =
            canaryData[step.index_stage - 1].states[step.index - 1];
        }
      }
    }
  };

  clearStepsSixthSense() {
    let { stages } = this.state;
    stages.forEach((state) => {
      state.steps.forEach((step) => {
        step.sub_steps.forEach((sub_step) => {
          sub_step.sixth_sense = false;
        });
      });
    });
  }

  setStepsSixthSense(stage_index, relation_steps) {
    let rsteps = JSON.stringify(relation_steps).replace(/[,\[\]]/g, "-");
    this.state.stages[stage_index - 1].steps.forEach((step) => {
      step.sub_steps.forEach((sub_step) => {
        if (rsteps.indexOf("-" + sub_step.index + "-") != -1) {
          sub_step.sixth_sense = true;
        }
      });
    });
  }

  updateSixthSenseSteps() {
    this.clearStepsSixthSense();
    this.state.stages.forEach((stage) => {
      stage.touchpoints.forEach((touchpoint) => {
        if (touchpoint.sixth_sense) {
          this.setStepsSixthSense(stage.index, touchpoint.relation_steps);
        }
      });
    });
  }

  activeSixthSenseIcon = () => {
    let {
      iconStartStatus,
      iconFireStatus,
      iconGoutStatus,
      iconCanaryStatus,
      iconSixthSenseStatus,
    } = this.state;
    iconSixthSenseStatus = !iconSixthSenseStatus;
    if (iconSixthSenseStatus) {
      this.updateSixthSenseSteps();
    }
    this.setState({
      iconStartStatus: false,
      iconGoutStatus: false,
      iconCanaryStatus: false,
      iconSixthSenseStatus: iconSixthSenseStatus,
      iconFireStatus: false,
    });
    this.resetIcons(
      iconStartStatus,
      iconFireStatus,
      iconGoutStatus,
      iconCanaryStatus
    );
  };

  activeCanaryIcon = () => {
    // console.log('aca canario');
    let {
      iconStartStatus,
      iconFireStatus,
      iconGoutStatus,
      iconCanaryStatus,
    } = this.state;
    let actualCanaryStatus = !this.state.iconCanaryStatus;

    //desactivamos todo el resto
    this.setState({
      iconGoutStatus: false,
      iconFireStatus: false,
      iconStartStatus: false,
      iconSixthSenseStatus: false,
    });

    this.resetIcons(
      iconStartStatus,
      iconFireStatus,
      iconGoutStatus,
      !actualCanaryStatus
    );

    if (!iconCanaryStatus) {
      //console.log('aca prendido:' + iconCanaryStatus);
      this.state.canaryData = this.StorageCanary.getLoadData();
      this.preSelectCanaryData(this.state.canaryData);
    }

    this.setState({ iconCanaryStatus: !iconCanaryStatus });

    //Data.canary_status = !iconCanaryStatus;
    this.state.iconCanaryStatus = !iconCanaryStatus;
  };
  activeStartIcon = () => {
    //console.log('este es la estrella');

    let {
      stages,
      iconStartStatus,
      iconFireStatus,
      iconGoutStatus,
      iconCanaryStatus,
    } = this.state;
    this.setState({
      iconGoutStatus: false,
      iconFireStatus: false,
      iconCanaryStatus: false,
      iconSixthSenseStatus: false,
    });
    this.resetIcons(
      !iconStartStatus,
      iconFireStatus,
      iconGoutStatus,
      iconCanaryStatus
    );
    if (!iconStartStatus) {
      let newData = [];
      for (const stage of stages) {
        stage.money_enabled = !iconStartStatus;
        stage.icon_visible = !iconStartStatus;
        newData.push(stage);
      }
      this.setState({
        stages: newData,
        iconStartStatus: !iconStartStatus,
        checkMoney: true,
      });
    } else {
      let newData = [];
      for (const stage of stages) {
        stage.money_enabled = !iconStartStatus;
        stage.icon_visible = !iconStartStatus;
        newData.push(stage);
      }
      this.setState({
        stages: newData,
        iconStartStatus: !iconStartStatus,
      });
    }
  };

  clearStepsHistoricError() {
    let { stages } = this.state;
    stages.forEach((state) => {
      state.steps.forEach((step) => {
        step.sub_steps.forEach((sub_step) => {
          sub_step.history_error = false;
        });
      });
    });
  }

  setStepsHistoricError(stage_index, relation_steps) {
    let rsteps = JSON.stringify(relation_steps).replace(/[,\[\]]/g, "-");
    this.state.stages[stage_index - 1].steps.forEach((step) => {
      step.sub_steps.forEach((sub_step) => {
        if (rsteps.indexOf("-" + sub_step.index + "-") != -1) {
          sub_step.history_error = true;
        }
      });
    });
  }

  updateHistoricErrors() {
    this.clearStepsHistoricError();
    this.state.stages.forEach((stage) => {
      stage.touchpoints.forEach((touchpoint) => {
        if (touchpoint.history_error) {
          this.setStepsHistoricError(stage.index, touchpoint.relation_steps);
        }
      });
    });
  }

  activeFireIcon = () => {
    let {
      iconStartStatus,
      iconFireStatus,
      iconGoutStatus,
      iconCanaryStatus,
    } = this.state;

    iconFireStatus = !iconFireStatus;
    if (iconFireStatus) {
      this.updateHistoricErrors();
    }
    this.setState({
      iconStartStatus: false,
      iconGoutStatus: false,
      iconCanaryStatus: false,
      iconSixthSenseStatus: false,
      iconFireStatus: iconFireStatus,
    });
    this.resetIcons(
      iconStartStatus,
      !iconFireStatus,
      iconGoutStatus,
      iconCanaryStatus
    );
  };

  activeGout = () => {
    let {
      iconStartStatus,
      iconFireStatus,
      iconGoutStatus,
      iconCanaryStatus,
    } = this.state;
    let next = !this.state.iconGoutStatus;
    this.setState({
      iconStartStatus: false,
      iconFireStatus: false,
      iconCanaryStatus: false,
      iconSixthSenseStatus: false,
    });
    this.resetIcons(
      iconStartStatus,
      iconFireStatus,
      !iconGoutStatus,
      iconCanaryStatus
    );
    if (next) {
      const { stages } = this.state;
      for (const stage of stages) {
        stage.gout_enable = true;
      }
      this.setState({ stages });
    } else {
      const { stages } = this.state;
      for (const stage of stages) {
        stage.gout_enable = false;
      }
      this.setState({ stages });
    }
    this.setState({ iconGoutStatus: next });
  };

  removeDuplicates(originalArray) {
    var newArray = [];
    var lookupObject = {};

    for (var i in originalArray) {
      lookupObject[originalArray[i]] = originalArray[i];
    }

    for (i in lookupObject) {
      newArray.push(lookupObject[i]);
    }
    return newArray;
  }

  openModal = (stage) => {
    this.setState({ viewModal: 0 });
    this.setState({ stageNameSelected: stage });
    this._onClose();
  };

  updateTouchpointStageOnOff(touchpoint){
    touchpoint.status_on_off = !touchpoint.status_on_off;
    this.setState({ stages: this.state.stages });
  }

  updateTouchpointOnOff = (touchpoint) =>{
    this.updateTouchpointStageOnOff(touchpoint);
    if(this.updateData){
      this.updateData.updateTouchpointOnOff(touchpoint);
    }
  };

  openModalParent = (touchpoint, view) => {
    const {stageNameSelected} = this.state;

    let datos = null;
    if(this.updateData){
      if(view==2){
        datos = this.updateData.getTouchpointTune(touchpoint);
      }else if(view==1){
        datos = this.updateData.getTouchpointQuerys(touchpoint);
      }
      console.log("DATOS:",datos);
    } else {

      if(this.state.emulatorActive){
        if(view==1){
          datos = this.emulator.getTouchpointQuerys(touchpoint);
          //console.table(datos);
        }else if(view==2){
          datos = this.emulator.getTouchpointTune(touchpoint);
        }  
      }
    }
    //console.log('aca estamos');
    //console.table(touchpoint);
    this.setState({ viewModal: view });
    this.setState({ stageNameSelected: {touchpoint,datos} });

    this._onClose();
  }

  changeCities = ({ value }) => {
    console.log("city:", value);
    this.setState({ city: value }, this.updateDataNow);
  };

  changeTimeRange = ({ value, label }) => {
    if (label === "Custom") {
      return this.setState({ customTimePicker: true });
    } else {
      this.setState({ customTimePicker: false });
      this.setState({ timeRange: value }, this.updateDataNow);
    }
    //this.setState({ timeRange: value }, this.updateDataNow);
  };

  resetIcons = (statusStar, statusFire, statusGot, statusCanary) => {
    if (statusStar) {
      const { stages } = this.state;
      let newData = [];
      for (const stage of stages) {
        stage.money_enabled = false;
        stage.icon_visible = false;
        newData.push(stage);
      }
      this.setState({
        stages: newData,
        iconStartStatus: false,
      });
    }
    if (statusFire) {
      const { stages } = this.state;
      //unselect all steps and touchpoints
      for (const stage of stages) {
        for (const step of stage.steps) {
          if (step.value === "") {
            for (const substep of step.sub_steps) {
              //substep.history_error = false;
              substep.highlighted = false;
            }
            //step.history_error = false;
            step.highlighted = false;
          } else {
            //step.history_error = false;
            step.highlighted = false;
          }
        }
        for (const touch of stage.touchpoints) {
          touch.highlighted = false;
          //touch.history_error = false;
        }
      }
      this.setState({
        stages,
        iconFireStatus: false,
      });
    }
    if (statusGot) {
      const { stages } = this.state;
      for (const stage of stages) {
        stage.gout_enable = false;
      }
      this.setState({
        stages,
        iconGoutStatus: false,
      });
    }
    if (statusCanary) {
      //console.log('aca deberiamos reiniciar todo y guardar data')ta
      // Data.canary_status = !statusCanary;
      this.state.iconCanaryStatus = !statusCanary;
    }
  };

  renderContentAboveStep = (statusStar, statusGot, statusFire, element) => {
    if (statusStar) {
      return (
        <div className="moneyStage">
          <div
            className="selectIcon"
            onClick={() => {
              this.openModal(element);
            }}
          >
            {element.icon_visible && (
              <>
                {element.icon_description === "medal" ? (
                  <img
                    className="sizeIconMedal"
                    src={element.icon_active ? medalIconOn : medalIcon}
                  />
                ) : (
                  <img
                    className="sizeIconStart"
                    src={element.icon_active ? startIconOn : startIcon}
                  />
                )}
              </>
            )}
          </div>
          <div className="cashStage" style={{ color: "#C59400" }}>
            {element.money}
          </div>
        </div>
      );
    }
    if (statusGot) {
      return (
        <div className="moneyStage">
          <div style={{ alignItems: "center", marginRight: "5%" }}>
            <img src={goutBlack} height="15px" width="11px" />
            <span className="goutTxt">{element.gout_quantity}</span>
          </div>
          <div className="cashStage" style={{ color: "#333333" }}>
            {element.money}
          </div>
        </div>
      );
    }
    if (statusFire) {
      return (
        <div className="moneyStageHistoryError">
          <div className="cashStage" style={{ color: "red" }}>
            {element.money}
          </div>
        </div>
      );
    }
  };

  changeTouchpointsView(event) {
    this.setState({ checkAllStatus: event.target.checked });
    console.log(event.target.checked);
  }
  changeDateStartDate(startDate) {
    let nuevaFecha = new Date();
    let convert = moment(startDate);
    let prueba = convert.toDate();
    let fechaRecibida =
      prueba.getFullYear() +
      "" +
      (prueba.getMonth() + 1) +
      "" +
      prueba.getDate();

    let fechaEvaluar =
      nuevaFecha.getFullYear() +
      "" +
      (nuevaFecha.getMonth() + 1) +
      "" +
      nuevaFecha.getDate();

    if (fechaRecibida === fechaEvaluar) {
      console.log("Cambiando de fecha");
      this.setState({ startDate: startDate, selectionDateStart: true });
    } else {
      console.log("otra fecha");
      this.setState({ startDate: startDate, selectionDateStart: false });
    }
  }
  changeDateEndDate(endDate) {
    let nuevaFecha = new Date();
    let convert = moment(endDate);
    let prueba = convert.toDate();

    let fechaRecibida =
      prueba.getFullYear() +
      "" +
      (prueba.getMonth() + 1) +
      "" +
      prueba.getDate();

    let fechaEvaluar =
      nuevaFecha.getFullYear() +
      "" +
      (nuevaFecha.getMonth() + 1) +
      "" +
      nuevaFecha.getDate();

    if (fechaRecibida === fechaEvaluar) {
      console.log("Cambiando de fecha");
      this.setState({ endDate: endDate, selectionDate: true });
    } else {
      console.log("otra fecha");
      this.setState({ endDate: endDate, selectionDate: false });
    }
  }

  _onClosePicker = () => {
    let actualValue = this.state.customTimePicker;
    this.setState({ customTimePicker: !actualValue });
  };
  
  _onCloseBackdrop = () => {
     console.log('cerrar');
     const { visible , backdrop, idVisible } = this.state;
     this.setState({ visible: !visible, idVisible: idVisible , backdrop: !backdrop });
     this.restoreTouchPoints();
     if(!visible){
       touchActive.active = true;
     }
  };

  customDates = () => {
    let { startDate, endDate } = this.state;
    let now_utc_start = Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
      startDate.getUTCHours(),
      startDate.getUTCMinutes(),
      startDate.getUTCSeconds()
    );

    let now_utc_end = Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate(),
      endDate.getUTCHours(),
      endDate.getUTCMinutes(),
      endDate.getUTCSeconds()
    );

    let fecha3 = `${now_utc_start} UNTIL ${now_utc_end}`;
    let setTimePicker = `${now_utc_start} UNTIL ${now_utc_end}`;
    let actualValue = this.state.customTimePicker;

    this.setState({ diffDate: fecha3 });
    this.setState({ customTimePicker: !actualValue });
    this.setState({ timeRange: setTimePicker }, this.updateDataNow);
  };
  //------------------------------------
  renderProps = (idVisible, touchActive) => {
    //console.log(idVisible);
   // console.table(this.state);
    const { visible , backdrop } = this.state;
    this.setState({ visible: !visible, idVisible: idVisible , backdrop: !backdrop });
    this.restoreTouchPoints();
    if(!visible){
      touchActive.active = true;
    }
  };

  restoreTouchPoints = () => {
    const { stages } = this.state;
    //unselect all steps and touchpoints
    for (const stage of stages) {
       
      for (const touch of stage.touchpoints) {
        touch.active = false;
        //touch.history_error = false;
      }
    }
  }
  handleChange(valor1, valor3, this_props) {
    console.log("valores",valor1, valor3);
    this_props.renderProps("", null);
  }

  changeMessage = (value)=> {
    const {stageNameSelected} = this.state;
    stageNameSelected.selectedCase = value;
    this.setState(stageNameSelected)
  }

  handleChangeTexarea= (event) => {
    const {stageNameSelected} = this.state;
    if (stageNameSelected.selectedCase) {
      stageNameSelected.datos[stageNameSelected.selectedCase.value].query_body = event.target.value;
    }
    else{
      stageNameSelected.datos[0].query_body = event.target.value;
    }
    this.setState(stageNameSelected)
  }

  handleSaveUpdateQuery = ()=>{

    //console.log(this.state.stageNameSelected)
    if(this.state.emulatorActive){
      alert('Only for Demo');
    } else {
        if(this.updateData){
          this.updateData.updateTouchpointQuerys(this.state.stageNameSelected.touchpoint,this.state.stageNameSelected.datos);
        }
        
    }
    this._onClose();
  }

  handleSaveUpdateTune=(event)=>{
    event.preventDefault();
    //console.log(this.state.stageNameSelected)
    //console.log(event.target.elements.threshold.value)
    //console.log(event.target.elements.apdex.value)
    if(this.state.emulatorActive){
      alert('Only for Demo');
    } else {
      if(this.updateData){
        let datos = {
          error_threshold: event.target.elements.threshold.value,
          apdex_time: event.target.elements.apdex.value
        }
        this.updateData.updateTouchpointTune(this.state.stageNameSelected.touchpoint,datos);
      }
    }  
    
    this._onClose();
  }

  render() {
    const {
      stages,
      iconSixthSenseStatus,
      iconCanaryStatus,
      iconFireStatus,
      iconStartStatus,
      hidden,
      checkMoney,
      stageNameSelected,
      viewModal,
      city,
      iconGoutStatus,
      loading,
      colors,
      countrys,
      tune,
      checkAllStatus,
      customTimePicker,
      startDate,
      endDate,
      diffDate,
      selectionDate,
      selectionDateStart,
      visible,
      idVisible,
      version
    } = this.state;
    let hoy = new Date();
    let hora = hoy.getHours();

    return (
      <div className="mainContainer">

        <div>
          <Header
            iconSixthSenseStatus={iconSixthSenseStatus}
            activeSixthSenseIcon={this.activeSixthSenseIcon}
            activeFireIcon={this.activeFireIcon}
            activeCanaryIcon={this.activeCanaryIcon}
            activeStartIcon={this.activeStartIcon}
            activeGoutIcon={this.activeGout}
            checkBudget={this.checkMoneyBudget}
            changeCities={this.changeCities}
            changeTimeRange={this.changeTimeRange}
            checkMoney={checkMoney}
            iconStartStatus={iconStartStatus}
            iconFireStatus={iconFireStatus}
            iconCanaryStatus={iconCanaryStatus}
            iconGoutStatus={iconGoutStatus}
            loading={loading}
            countrys={countrys}
            diffDate={diffDate}
            version={version}
          />
        </div>
        <div className="contentContainer">
      
          <div onClick={this._onCloseBackdrop}  className="fade modal-backdrop in" style={{ 
            display: this.state.backdrop == false
            ? "none"  : "block",
            opacity : this.state.backdrop == false
            ? "0.1"  : "0"

           }}>  </div>
          <div className="title">Stages</div>
          <div className="content">
            {stages.map((element) => (
              <div key={element.index} className="mainColumn" style={{width: "20%",borderLeftStyle: element.active_dotted, color: element.active_dotted_color, borderWidth:"2px"}}>
                <Stage
                  index={element.index}
                  onClickStage={this.onClickStage}
                  title={element.title}
                  circleColor={element.errors}
                  percentageCongestion={element.congestion.percentage}
                  valueCongestion={element.congestion.value}
                  capacityPercentage={element.capacity}
                  totalCountStage={element.total_count}
                  goutActive={element.gout_enable}
                  goutQuantity={element.gout_quantity}
                  status={element.status_color}
                  iconName={element.icon_name}
                  iconHeight={element.icon_height}
                  url={
                    element.dashboard_url == false
                      ? "false"
                      : element.dashboard_url
                  }
                  colors={colors}
                />
              </div>
            ))}
          </div>
          <div
            style={{ display: "flex", marginTop: "0px", marginBottom: "0px", height:"70px", paddingBottom:"2px", paddingTop:"2px" }}
          >
              <div style={{position:"relative"}} >
                <div style={{position:"absolute", height:"100%", width:"250px", top:"20px", left:"20px"}}> 
                    
                    <div className="titleCnt">
                    Steps &nbsp;
                
                      
                      </div>
                
              </div>
            </div>
            {stages.map((element, index) => {
              return (
                <div key={element.title} style={{width: "20%", display: "flex", marginTop: "0px" }}>

                <div  style={{ width: "100%",borderLeftStyle: element.active_dotted, color: element.active_dotted_color , borderWidth:"2px"}} >
                 
                </div>
                </div>
              );
            })}

          </div>

          <div style={{ display: "flex", marginTop: "0px" }}>
            {stages.map((element) => {
              return (
                <div key={element.title} style={{width: "20%", display: "flex", marginTop: "0px" }}>

                <div  style={{ width: "100%", borderLeftStyle: element.active_dotted, color: element.active_dotted_color , borderWidth:"2px"}}>
                  {element.money_enabled |
                  element.gout_enable |
                  iconFireStatus ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplate: "5% 1fr/ 1fr",
                        width: "100%",
                      }}
                    >
                      {this.renderContentAboveStep(
                        element.money_enabled,
                        element.gout_enable,
                        iconFireStatus,
                        element
                      )}
                      <div
                        className="stepColumn"
                        style={{ width: "100%", marginTop: "5%" }}
                      >
                        <StepContainer
                          steps={element.steps}
                          latencyStatus={element.latencyStatus}
                          onclickStep={this.onclickStep}
                          iconGoutStatus={iconGoutStatus}
                          iconCanaryStatus={iconCanaryStatus}
                          colors={colors}
                          iconFireStatus={iconFireStatus}
                          iconSixthSenseStatus={iconSixthSenseStatus}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="stepColumn">
                      <StepContainer
                        steps={element.steps}
                        latencyStatus={element.latencyStatus}
                        title={element.title}
                        onclickStep={this.onclickStep}
                        iconGoutStatus={iconGoutStatus}
                        iconCanaryStatus={iconCanaryStatus}
                        colors={colors}
                        iconFireStatus={iconFireStatus}
                        iconSixthSenseStatus={iconSixthSenseStatus}
                      />
                    </div>
                  )}
                </div>
                </div>
              );
            })}
          </div>

          <div
            style={{ display: "flex", marginTop: "0px", marginBottom: "0px", height:"70px", paddingBottom:"2px", paddingTop:"2px" }}
          >
              <div style={{position:"relative"}} >
                <div style={{position:"absolute", height:"100%", width:"250px", top:"15px", left:"20px"}}> 
                    
                    <div className="titleCnt">
                      TouchPoints &nbsp;
                
                      <input
                        type="Checkbox"
                        onChange={(event) => this.changeTouchpointsView(event)}
                      />
                      <label className="checkboxLabel">view all</label>
                      </div>
                
              </div>
            </div>
            {stages.map((element, index) => {
              return (
                <div key={element.title} style={{width: "20%", display: "flex", marginTop: "0px" }}>

                <div  style={{ width: "100%",borderLeftStyle: element.active_dotted, color: element.active_dotted_color, borderWidth:"2px"}} >
                 
                </div>
                </div>
              );
            })}

          </div>
         
          <div
            style={{ display: "flex", marginTop: "0px", marginBottom: "0px" }}
          >
            {stages.map((element, index) => {
              return (
                <div key={element.title} style={{width: "20%", display: "flex", marginTop: "0px" }}>

                <div  style={{ width: "100%",borderLeftStyle: element.active_dotted, color: element.active_dotted_color, borderWidth:"2px" }} >
                 <TouchPointContainer
                    handleChange={this.handleChange}
                    visible={visible}
                    idVisible={idVisible}
                    renderProps={this.renderProps}
                    touchpoints={element.touchpoints}
                    city={city}
                    colors={colors}
                    iconFireStatus={iconFireStatus}
                    checkAllStatus={checkAllStatus}
                    iconSixthSenseStatus={iconSixthSenseStatus}
                    openModalParent={this.openModalParent}
                    updateTouchpointOnOff={this.updateTouchpointOnOff}
                    tune={tune}
                  />
                </div>
                </div>
              );
            })}
          </div>
        </div>
        <Modal
          hidden={hidden}
          _onClose={this._onClose}
          stageNameSelected={stageNameSelected}
          viewModal={viewModal}
          changeMessage={this.changeMessage}
          handleChangeTexarea={this.handleChangeTexarea}
          handleSaveUpdateQuery={this.handleSaveUpdateQuery}
          handleSaveUpdateTune={this.handleSaveUpdateTune}
        />
        <div className="modalMoque">
          <Moque
            show={customTimePicker}
            onHide={this._onClosePicker}
            style={{
              display: "grid",
              gridTemplateColumns: "auto auto",
              height: "400px",
              alignContent: "center",
              alignItems: "center",
            }}
            className="holiboli"
          >
            <Moque.Body style={{ width: "450px" }} className="topo">
              <p>CUSTOM</p>
              <div className="wrapperMoque">
                <DatePicker
                  selected={startDate}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={endDate}
                  minTime={
                    selectionDateStart
                      ? setHours(setMinutes(new Date(), 0), 0)
                      : null
                  }
                  maxTime={
                    selectionDateStart
                      ? setHours(setMinutes(new Date(), 30), hora)
                      : null
                  }
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:m aa"
                  onChange={(date) => this.changeDateStartDate(date)}
                />
                <DatePicker
                  selected={endDate}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  showTimeSelect
                  dateFormat="MMMM d, yyyy h:m aa"
                  minDate={startDate}
                  maxDate={new Date()}
                  minTime={
                    selectionDate
                      ? setHours(setMinutes(new Date(), 0), 0)
                      : null
                  }
                  maxTime={
                    selectionDate
                      ? setHours(setMinutes(new Date(), 30), hora)
                      : null
                  }
                  onChange={(date) => this.changeDateEndDate(date)}
                />
              </div>
            </Moque.Body>
            <Moque.Footer>
              <Button
                variant="secondary"
                onClick={this._onClosePicker}
                style={{ background: "white", color: "#008C99" }}
              >
                Cancel
              </Button>
              <Button
                style={{ background: "#A6DDEF", color: "#008C99" }}
                onClick={this.customDates}
              >
                Apply
              </Button>
            </Moque.Footer>
          </Moque>
        </div>
        <div id="cover-spin" style={{ display: loading ? "" : "none" }}></div>
      </div>
    );
  }
}

MainContainer.contextType = AppContext;
