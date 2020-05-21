import React from 'react'
import Head from 'next/head'
import App from '../components/app'
import { getCurrentStatus } from '../services/statusService'

export type InitialProps = {
  bagBeerStatus: {
    updated: Date,
    status: string
  } | string
}

const HomePage = (props: InitialProps) =>
  <div className="root">
    <Head>
      <title>BagBeer Status in Helsinki</title>
    </Head>
    <App bagBeerStatus={props.bagBeerStatus} />
  </div>

export async function getServerSideProps(context) {
  return {
    props: {
      bagBeerStatus: await getCurrentStatus()
    }
  }
}

export default HomePage
