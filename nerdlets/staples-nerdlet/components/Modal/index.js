
import React from 'react';

import { Modal } from 'react-bootstrap';

import graphImage from '../../images/graph.png';
import startIcon from '../../images/StartIcon.svg';
import startIconOn from '../../images/StartIconOn.svg';
import medalIcon from '../../images/medalIcon.svg';
import medalIconOn from '../../images/medalIconOn.svg';
import closeIcon from '../../images/closeIcon.svg';

import Select from "react-select";
import {  Button } from "react-bootstrap";

function __body(viewModal, stageNameSelected, _onClose, handleChangeTexarea, handleSaveUpdateQuery, handleSaveUpdateTune) {
    switch (viewModal) {
        case 0:
            return (
                <img
                    src={graphImage}
                />
            );
            break;
        case 1:
            let value = stageNameSelected.selectedCase ? stageNameSelected.selectedCase.value : 0 ;
            let query_start = stageNameSelected.datos[value].query_start;
            let query_body = stageNameSelected.datos[value].query_body;
            let query_footer = stageNameSelected.datos[value].query_footer;
            return (
                <div style={{width:"500px", paddingTop:"20px"}}>
                    <strong>{query_start}</strong>
                    <textarea value={query_body} onChange={handleChangeTexarea} style={{height:"50px", border:"1px solid #D0D0D0", margin:"10px 0px 10px 0px", padding:"5px"}} />
                    <strong>{query_footer}</strong>
                <div style={{float:"right", margin:"50px 0px 0px 0px"}}> 
                    <Button variant="contained" color="primary" style={{background:"#0178bf"}}
                        onClick={handleSaveUpdateQuery}
                    >
                        Save / Update
                    </Button></div>
                </div>
            );
            break;
        case 2:
            let error_threshold = stageNameSelected.datos.error_threshold;
            let apdex_time = stageNameSelected.datos.apdex_time;
            return (
                <div style={{width:"250px", paddingTop:"40px"}}>
                    <form onSubmit={handleSaveUpdateTune}>
                        <div style={{height:"40px"}}> <label className="bodySubTitle" style={{width:"100px", textAlign:"right", fontSize:"14px"}}>Error threshold </label> <input id="threshold" name="threshold" type="text" defaultValue = {error_threshold} className="inputText" style={{width:"60px", border:"1px solid gray", padding:"5px"}}></input></div>
                        <div style={{height:"40px"}}> <label className="bodySubTitle" style={{width:"100px", textAlign:"right", fontSize:"14px"}}>Apdex t:</label> <input id="apdex" name="apdex" type="text" defaultValue = {apdex_time} className="inputText" style={{width:"60px", border:"1px solid gray", padding:"5px"}}></input></div>

                        <div style={{float:"right", margin:"20px 0px 0px 0px"}}> 
                            <Button type="submit" variant="contained" color="primary"  style={{background:"#0178bf"}} 
                            >
                            Save / Update
                            </Button>
                        </div>
                    </form>
                </div>
            );
            break;

    }
}

function __header(viewModal, stageNameSelected, _onClose, changeMessage) {
    switch (viewModal) {
        case 0:
            return (
                <div className="headerModal">
                    {stageNameSelected.icon_description === "medal" ?
                        <div style={{ display: "flex" }}>
                            <img
                                style={{
                                    width: '26px',
                                    height: '26px',
                                    marginLeft: "5px"
                                }}
                                src={stageNameSelected.icon_active ? medalIconOn : medalIcon}
                            />
                            <div className="titleModal">
                                {stageNameSelected.title}
                            </div>
                        </div>
                        : <div style={{ display: "flex" }}>
                            <img
                                style={{
                                    width: '26px',
                                    height: '26px',
                                    marginLeft: "5px"
                                }}
                                src={stageNameSelected.icon_active ? startIconOn : startIcon}
                            />
                            <div className="titleModal">
                                {stageNameSelected.title}
                            </div>
                        </div>
                    }
                    <div className="selectIcon" onClick={() => {
                        _onClose()
                    }
                    }>
                        <img
                            style={{
                                width: '26px',
                                height: '26px'
                            }}
                            src={closeIcon}
                        />
                    </div>
                </div>
            );
            break;
        case 1:
            return (
                <div className="headerModal">

                    <div style={{ display: "flex" }}>

                        <div className="titleModal" style={{width: "290px"}}>
                            {stageNameSelected.touchpoint.value}
                        </div>
                        <div style={{  paddingRight:"10px" }}>
                            <Select
                                onChange={(e)=>{changeMessage(e,stageNameSelected)}}
                                placeholder={stageNameSelected.datos[0].label}
                                isSearchable={false}
                                classNamePrefix="react-select"
                                options={stageNameSelected.datos}
                            />
                        </div>
                    </div>

                    <div className="selectIcon" onClick={() => {
                        _onClose()
                    }
                    }>
                        <img
                            style={{
                                width: '26px',
                                height: '26px'
                            }}
                            src={closeIcon}
                        />
                    </div>
                </div>
            );
            break;
        case 2:
            return (
                <div className="headerModal">

                    <div style={{ display: "flex" }}>

                        <div className="titleModal">
                            {stageNameSelected.touchpoint.value}
                        </div>
                    </div>

                    <div className="selectIcon" onClick={() => {
                        _onClose()
                    }
                    }>
                        <img
                            style={{
                                width: '26px',
                                height: '26px'
                            }}
                            src={closeIcon}
                        />
                    </div>
                </div>
            );
            break;

    }
}

function ModalWindow(props) {
    let { hidden, _onClose, stageNameSelected, viewModal, changeMessage, handleChangeTexarea, handleSaveUpdateQuery, handleSaveUpdateTune } = props;

    return (
        <Modal
            show={hidden}
            onHide={() => _onClose}
            aria-labelledby="contained-modal-title-vcenter"
        >
            <Modal.Body>
                <div className="containModal">

                    {__header(viewModal, stageNameSelected, _onClose, changeMessage)}

                    <div style={{ width: "100%", height: "100%" }}>
                        {__body(viewModal, stageNameSelected, _onClose, handleChangeTexarea, handleSaveUpdateQuery, handleSaveUpdateTune)}
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
}


export default ModalWindow;
