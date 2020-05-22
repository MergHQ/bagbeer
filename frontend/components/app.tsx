import React, { useState } from 'react'
import additionalInfo from '../fixtures/statusAdditionalInfo'
import format from 'date-fns/format'
import { getCurrentStatus } from '../services/statusService'
import { useEffect } from 'react'

type BagBeerStatusProps = {
  updated: Date,
  status: string,
  update: () => void
}

type Props = {
  bagBeerStatus: {
    updated: Date,
    status: string
  } | string
}

const StatusContainer = (props: BagBeerStatusProps) =>
  <div className="status-container">
    <h1 className="header">{props.status}</h1>
    <h2 className="additional-info">{additionalInfo[props.status]}</h2>
    <p>{format(new Date(props.updated), 'd.M.yyyy kk:mm')}</p>
    <button className="update-button" onClick={props.update}>Update</button>
  </div>

const GitHubLogo = () =>
  <div className="logo-container">
    <a className="github-logo" href="https://github.com/MergHQ/bagbeer">
      <img className="github-logo" src="github.svg"></img>
    </a>
  </div>

const App = (props: Props) => {
  const [bagBeerStatus, setStatus] = useState(props.bagBeerStatus)

  return (
    <div className={`container ${typeof bagBeerStatus === 'string' ? 'bad' : bagBeerStatus.status}`}>
      <GitHubLogo />
      {typeof bagBeerStatus === 'string' ?
        <h1>{bagBeerStatus}</h1> :
        <StatusContainer
          updated={bagBeerStatus.updated}
          status={bagBeerStatus.status}
          update={() => getCurrentStatus().then(setStatus)}
        />}
    </div>
  )
}



export default App
