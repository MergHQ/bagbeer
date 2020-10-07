import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'

const appLabels = { app: 'bagbeer-service' }

const getSecretRef = (secretName: string): pulumi.Input<k8s.types.input.core.v1.EnvVarSource> => ({
  secretKeyRef: {
    name: `${appLabels.app}-secrets`,
    key: secretName
  }
})

const deployment = new k8s.apps.v1.Deployment('bagbeer-service', {
  spec: {
    selector: { matchLabels: appLabels },
    replicas: 1,
    template: {
      metadata: { labels: appLabels },
      spec: {
        containers: [
          {
            name: appLabels.app,
            image: 'registry.digitalocean.com/merg-registry/bagbeer-service:latest',
            imagePullPolicy: 'Always',
            ports: [{
              containerPort: 3000,
              protocol: 'TCP'
            }],
            env: [
              {
                name: 'PORT',
                value: '3000'
              },
              {
                name: 'POLY_ID',
                valueFrom: getSecretRef('POLY_ID')
              },
              {
                name: 'AGRO_API_TOKEN',
                valueFrom: getSecretRef('AGRO_API_TOKEN')
              },
              {
                name: 'DARKSKY_TOKEN',
                valueFrom: getSecretRef('DARKSKY_TOKEN')
              }
            ]
          }
        ]
      },
    },
  },
})

const service = new k8s.core.v1.Service(appLabels.app, {
  metadata: {
    name: appLabels.app,
  },
  spec: {
    selector: appLabels,
    ports: [{
      port: 80,
      targetPort: 3000
    }],
  }
})
