import React from "react";

import logo from "../../images/logo.png";
import fireIcon from "../../images/FireIcon.svg";
import fireIconOn from "../../images/FireIconOn.svg";
import startIcon from "../../images/StartIcon.svg";
import startIconOn from "../../images/StartIconOn.svg";
import goutIcon from "../../images/gout.svg";
import goutIconOn from "../../images/goutBlack.svg";
import canaryIcon from "../../images/CanaryIcon.svg";
import canaryIconOn from "../../images/CanaryIconOn.svg";
import sixthSenseIcon from "../../images/SixthSense.svg";
import sixthSenseIconOn from "../../images/SixthSenseOn.svg";
import Select from "react-select";
import { Spinner } from "nr1";

/**
 *Component header class
 * @export
 * @class Header
 * @extends {React.Component}
 */
export default class Header extends React.Component {
  /**
   *Method that capture click action above icon fire
   *
   * @memberof Header
   */

  activeIconFire = () => {
    this.props.activeFireIcon();
  };

  checkBudget = () => {
    this.props.checkBudget();
  };
  returnSpin = (
    loading,
    iconCanaryStatus,
    iconGoutStatus,
    iconStartStatus,
    iconFireStatus
  ) => {
    if (loading) {
      if (
        loading &&
        !iconCanaryStatus &&
        !iconGoutStatus &&
        !iconStartStatus &&
        !iconFireStatus
      ) {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100px",
              alignItems: "center",
            }}
          >
            <Spinner type={Spinner.TYPE.DOT} />
            <span>Loading...</span>
          </div>
        );
      } else if (
        loading &&
        iconCanaryStatus | iconGoutStatus | iconStartStatus | iconFireStatus
      ) {
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "200px",
              flexDirection: "row",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100px",
                alignItems: "center",
              }}
            >
              <Spinner type={Spinner.TYPE.DOT} />
              <span>Loading...</span>
            </div>
            <span
              className="budgetLoss"
              style={{
                visibility:
                  iconGoutStatus | iconStartStatus | iconFireStatus
                    ? "visible"
                    : "hidden",
                color: iconFireStatus && "red",
              }}
            >
              - $5,200
            </span>
          </div>
        );
      }
    } else {
      return (
        <span
          className="budgetLoss"
          style={{
            visibility:
              iconGoutStatus | iconStartStatus | iconFireStatus
                ? "visible"
                : "hidden",
            color: iconFireStatus && "red",
          }}
        >
          - $5,200{" "}
        </span>
      );
    }
  };

  render() {
    let {
      iconSixthSenseStatus,
      activeSixthSenseIcon,
      iconCanaryStatus,
      iconFireStatus,
      iconStartStatus,
      activeCanaryIcon,
      activeStartIcon,
      changeCities,
      changeTimeRange,
      iconGoutStatus,
      activeGoutIcon,
      countrys,
      diffDate,
      version
    } = this.props;
    const options = [
      { label: "now", value: "5 MINUTES AGO" },
      { label: "30 minutes", value: "30 MINUTES AGO" },
      { label: "60 minutes", value: "60 MINUTES AGO" },
      { label: "3 hours", value: "3 HOURS AGO" },
      { label: "6 hours", value: "6 HOURS AGO" },
      { label: "12 hours", value: "12 HOURS AGO" },
      { label: "24 hours", value: "24 HOURS AGO" },
      { label: "3 days", value: "3 DAYS AGO" },
      { label: "7 days", value: "7 DAYS AGO" },
      { label: "Custom", value: `${diffDate}` },
    ];
    return (
      <div className="containerHeader">
        <div className="quantityDinner">
          <img src={logo} height="24px" />
          <span className="ppversion" style={{display:'none'}}>version:{version}</span>
          <div style={{ marginLeft: "40px" }}>
            <Select
              onChange={changeCities}
              placeholder={countrys[0].label}
              isSearchable={false}
              classNamePrefix="react-select"
              options={countrys}
            />
          </div>
        </div>
        <span
          className="budgetLoss"
          style={{
            visibility:
              iconGoutStatus | iconStartStatus | iconFireStatus
                ? "visible"
                : "hidden",
            color: iconFireStatus && "red",
          }}
        >
          - $5,200{" "}
        </span>
        <div className="distributionIcons">
          <div 
            className="fireIconContainer"
            onClick={() => {
              activeSixthSenseIcon();
            }}
          >
            <img
              style={{ height: "18px" }}
              src={iconSixthSenseStatus ? sixthSenseIconOn : sixthSenseIcon}
            />
          </div>
          <div
            className="fireIconContainer"
            onClick={() => {
              activeCanaryIcon();
            }}
          >
            <img
              style={{ height: "18px" }}
              src={iconCanaryStatus ? canaryIconOn : canaryIcon}
            />
          </div>
          <div
            className="fireIconContainer"
            onClick={() => {
              activeGoutIcon();
            }}
          >
            <img
              style={{ height: "18px" }}
              src={iconGoutStatus ? goutIconOn : goutIcon}
            />
          </div>
          <div
            className="fireIconContainer"
            onClick={() => {
              activeStartIcon();
            }}
          >
            <img
              style={{ height: "18px" }}
              src={iconStartStatus ? startIconOn : startIcon}
            />
          </div>
          <div
            className="fireIconContainer"
            onClick={() => {
              this.activeIconFire();
            }}
          >
            <img
              style={{ height: "18px" }}
              src={iconFireStatus ? fireIconOn : fireIcon}
            />
          </div>
          <Select
            onChange={changeTimeRange}
            placeholder={"now"}
            isSearchable={false}
            classNamePrefix="react-select"
            options={options}
          />
        </div>
      </div>
    );
  }
}
