import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'

console.log(process.env.CERT_ID)

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
              }
            ]
          }
        ]
      },
    },
  },
})

const frontend = new k8s.core.v1.Service(appLabels.app, {
  metadata: {
    name: appLabels.app,
    annotations: {
      'service.beta.kubernetes.io/do-loadbalancer-hostname': 'pk-api.lab.juiciness.io',
      'service.beta.kubernetes.io/do-loadbalancer-certificate-id': process.env.CERT_ID!,
      'service.beta.kubernetes.io/do-loadbalancer-redirect-http-to-https': 'true'
    },
  },
  spec: {
    type: 'LoadBalancer',
    selector: appLabels,
    ports: [{
      name: 'https',
      protocol: 'TCP',
      port: 443,
      targetPort: 3000
    }],
  }
})

export const ip = frontend.status.loadBalancer.apply(lb => lb.ingress[0].ip || lb.ingress[0].hostname)
