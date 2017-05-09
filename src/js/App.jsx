import React, { Component } from 'react';


const Close = (props) => (
  <button type="button" className="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
  </button>
)

export default class extends Component {

  constructor(props) {
    super(props);
    this.state = {
      counter: 1,
    }
  }

  async componentDidMount() {
    await setTimeout(() => this.setState(prev => ({counter: prev.counter+1})), 2000);
  }

  render() {
    const classes = 'text-center alert rounded-0 my-0 alert-dismissible fade show';
    return (
      <div>
        <div className={`${classes} alert-danger`}><Close/> Testing this out</div>
        <div className={`${classes} alert-info`}><Close/> Testing this out</div>
        <div className={`${classes} alert-success`}><Close/> Testing this out</div>

        <div className='container mt-3'>
          <div className="row">Test</div>
          <button className="btn btn-custom ">Test</button>
          <i className="fa fa-address-book" aria-hidden="true"></i>
        </div>
      </div>
    );
  }
}
