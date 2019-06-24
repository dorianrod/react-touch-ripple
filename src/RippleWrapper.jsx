// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import cn from 'classnames';
import {
	TransitionGroup,
} from 'react-transition-group';

import Ripple from './Ripple';
import './style/index.css';

class RippleWrapper extends React.Component {
    static defaultProps = {
        component: 'div',
        coeffSize: 1,
        center: false,
        color: 'currentColor',
        timeout: {
            enter: 500,
            exit: 500,
        },
    }

    state = {
        rippleArray: [],
        nextKey: 0,
    };

    startTimeout = null;
    startWrapper: () => null;
    ignoringMousedown: false;

    handleMouseDown = (e) => { this.start(e); }

    handleMouseUp = (e) => { this.stop(e); }

    handleMouseLeave = (e) => { this.stop(e); }

    handleTouchStart = (e) => { this.start(e); }

    handleTouchEnd = (e) => { this.stop(e); }

    handleTouchMove = (e) => { this.stop(e); }

    componentWillUnmount () {
        clearTimeout(this.startTimeout);
    }

    start(e) {
        if (e.type === 'mousedown' && this.ignoringMousedown) {
            this.ignoringMousedown = false;
            return;
        }
        if (e.type === 'touchstart') {
            this.ignoringMousedown = true;
        }

        const { center, coeffSize, timeout } = this.props;

        const element = ReactDOM.findDOMNode(this);
        const rect = element
            ? element.getBoundingClientRect()
            : {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                width: 0,
                height: 0,
            };
        
        let rippleX, rippleY, rippleSize;
        // calculate coordinates of the ripple
        if (
            center ||
            (e.clientX === 0 && e.clientY === 0) ||
            (!e.clientX && !e.touches)
        ) {
            // place the ripple in the center of the rect
            rippleX = Math.round(rect.width / 2);
            rippleY = Math.round(rect.height / 2);
        } else {
            const clientX = e.clientX ? e.clientX : e.touches[0].clientX;
            const clientY = e.clientY ? e.clientY : e.touches[0].clientY;
            rippleX = Math.round(clientX - rect.left);
            rippleY = Math.round(clientY - rect.top);
        }
        
        // calculate the size of the ripple
        if (center) {
            rippleSize = (coeffSize || 1) * Math.sqrt((2 * Math.pow(rect.width, 2) + Math.pow(rect.height, 2)) / 3);
        } else {
            const sizeX = Math.max(Math.abs((element ? element.clientWidth : 0) - rippleX), rippleX) * 2 + 2;
            const sizeY = Math.max(Math.abs((element ? element.clientHeight : 0) - rippleY), rippleY) * 2 + 2;
            rippleSize = (coeffSize || 1) * Math.sqrt(Math.pow(sizeX, 2) + Math.pow(sizeY, 2));
            /*
            const sizeX = Math.max(Math.abs((element ? element.clientWidth : 0) - rippleX), rippleX) * 2 + 2;
            const sizeY = Math.max(Math.abs((element ? element.clientHeight : 0) - rippleY), rippleY) * 2 + 2;
            rippleSize = 1.2 * Math.sqrt(Math.pow(sizeX, 2) + Math.pow(sizeY, 2)) / 2;*/
           //rippleSize = 1.2 * Math.max(sizeX, sizeY);
        }

        // Execute
        if (e.touches) {
            // delay the ripple effect for touch devices
            // because touchend event always triggers fast enough
            // without the user even noticed the ripple effect 
            this.startWrapper = () => {
                this.createRipple({ rippleX, rippleY, rippleSize, timeout });
            };
            // the timeout can not be too long as it will become laggy
            this.startTimeout = setTimeout(() => {
                this.startWrapper();
                this.startWrapper = null;
            }, 80);
        } else {
            this.createRipple({ rippleX, rippleY, rippleSize, timeout });
        }
    }

    createRipple(params) {
        const { rippleX, rippleY, rippleSize, timeout } = params;
        let rippleArray = this.state.rippleArray;

        rippleArray = [
            ...rippleArray,
            <Ripple 
                timeout={timeout}
                color={this.props.color}
                key={this.state.nextKey}
                rippleX={rippleX}
                rippleY={rippleY}
                rippleSize={rippleSize}
            />
        ];

        this.setState({
            rippleArray: rippleArray,
            nextKey: this.state.nextKey + 1,
        });
    }

    stop(e) {
        clearTimeout(this.startTimeout);
        const { rippleArray } = this.state;

        if (e.type === 'touchend' && this.startWrapper) {
            // when touchend was triggerd
            // before `createRipple` was fired
            // so we invoke createRipple immediately
            // and schedule for the stop event
            e.persist();
            this.startWrapper();
            this.startWrapper = null;
            this.startTimeout = setTimeout(() => {
                this.stop(e);
            }, 0);
            return;
        }

        this.startWrapper = null;

        if (rippleArray && rippleArray.length) {
            // remove the first ripple
            this.setState({
                rippleArray: rippleArray.slice(1),
            });
        }
    }

    render () {
        const {
            className,
            // eslint-disable-next-line
            center,
            component: Component,
            children,
            color,
            timeout,
            coeffSize,
            ...other
        } = this.props;

        return (
            <Component 
                className={cn('rtr-root', className)}
                onMouseDown={this.handleMouseDown}
                onMouseUp={this.handleMouseUp}
                onMouseLeave={this.handleMouseLeave}
                onTouchStart={this.handleTouchStart}
                onTouchEnd={this.handleTouchEnd}
                onTouchMove={this.handleTouchMove}
                {...other}
            >
                {children}
                <TransitionGroup
                    component={null}
                    enter
                    exit
                >
                    {this.state.rippleArray}
                </TransitionGroup>
            </Component>
        );
    }
};

export default RippleWrapper;