export const workloads = [
  {
    "workloadName": "struts-attacher:1.0",
    "type": "Deployment",
    "namespace": "default",
    "imagesUsed": 6,
    "affectingCVEs": 78,
    "severity": {
      "critical": 10,
      "high": 20,
      "medium": 18,
      "low": 10,
      "unknown": 20
    }
  },
  {
    "workloadName": "imagemagick4.8.5613",
    "type": "DaemonSet",
    "namespace": "kube-system",
    "imagesUsed": 2,
    "affectingCVEs": 0,
    "severity": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0,
      "unknown": 0
    }
  },
  {
    "workloadName": "centos7.7.1908",
    "type": "StatefulSet",
    "namespace": "kube-public",
    "imagesUsed": 4,
    "affectingCVEs": 101,
    "severity": {
      "critical": 25,
      "high": 0,
      "medium": 33,
      "low": 0,
      "unknown": 43
    }
  },
  {
    "workloadName": "nginx1.19.10",
    "type": "CronJob",
    "namespace": "cattle-system",
    "imagesUsed": 14,
    "affectingCVEs": 156,
    "severity": {
      "critical": 26,
      "high": 16,
      "medium": 50,
      "low": 44,
      "unknown": 20
    }
  },
  {
    "workloadName": "docker-compose:1.29.2",
    "type": "Pod",
    "namespace": "cattle-fleet-system",
    "imagesUsed": 23,
    "affectingCVEs": 19,
    "severity": {
      "critical": 1,
      "high": 3,
      "medium": 7,
      "low": 5,
      "unknown": 3
    }
  },
  {
    "workloadName": "python3.9.7",
    "type": "Job",
    "namespace": "cattle-monitoring-system",
    "imagesUsed": 1,
    "affectingCVEs": 222,
    "severity": {
      "critical": 70,
      "high": 10,
      "medium": 100,
      "low": 42,
      "unknown": 0
    }
  },
  {
    "workloadName": "nodejs14.17.3",
    "type": "Deployment",
    "namespace": "ingress-nginx",
    "imagesUsed": 19,
    "affectingCVEs": 187,
    "severity": {
      "critical": 101,
      "high": 0,
      "medium": 57,
      "low": 12,
      "unknown": 17
    }
  },
  {
    "workloadName": "redis5.0.7",
    "type": "DaemonSet",
    "namespace": "cert-manager",
    "imagesUsed": 11,
    "affectingCVEs": 11,
    "severity": {
      "critical": 1,
      "high": 0,
      "medium": 1,
      "low": 0,
      "unknown": 9
    }
  },
  {
    "workloadName": "mongodb4.4.1",
    "type": "StatefulSet",
    "namespace": "linkerd",
    "imagesUsed": 2,
    "affectingCVEs": 234,
    "severity": {
      "critical": 50,
      "high": 10,
      "medium": 100,
      "low": 64,
      "unknown": 10
    }
  },
  {
    "workloadName": "golang1.16.5",
    "type": "CronJob",
    "namespace": "istio-system",
    "imagesUsed": 8,
    "affectingCVEs": 89,
    "severity": {
      "critical": 22,
      "high": 3,
      "medium": 44,
      "low": 10,
      "unknown": 10
    }
  },
  {
    "workloadName": "ruby2.7.3",
    "type": "Pod",
    "namespace": "knative-serving",
    "imagesUsed": 16,
    "affectingCVEs": 213,
    "severity": {
      "critical": 23,
      "high": 9,
      "medium": 100,
      "low": 81,
      "unknown": 0
    }
  },
  {
    "workloadName": "elasticsearch7.10.0",
    "type": "Job",
    "namespace": "openfaas",
    "imagesUsed": 21,
    "affectingCVEs": 45,
    "severity": {
      "critical": 10,
      "high": 0,
      "medium": 20,
      "low": 5,
      "unknown": 10
    }
  },
  {
    "workloadName": "mysql8.0.25",
    "type": "Deployment",
    "namespace": "monitoring",
    "imagesUsed": 5,
    "affectingCVEs": 99,
    "severity": {
      "critical": 50,
      "high": 0,
      "medium": 40,
      "low": 0,
      "unknown": 9
    }
  },
  {
    "workloadName": "php8.0.9",
    "type": "DaemonSet",
    "namespace": "logging",
    "imagesUsed": 13,
    "affectingCVEs": 250,
    "severity": {
      "critical": 100,
      "high": 25,
      "medium": 75,
      "low": 20,
      "unknown": 30
    }
  },
  {
    "workloadName": "postgresql13.3",
    "type": "StatefulSet",
    "namespace": "gitlab-managed-apps",
    "imagesUsed": 24,
    "affectingCVEs": 67,
    "severity": {
      "critical": 10,
      "high": 5,
      "medium": 30,
      "low": 10,
      "unknown": 10
    }
  }
];