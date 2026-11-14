import { pageTitle } from 'ember-page-title';
import AppShell from 'client-v2/components/app-shell';

<template>
  {{pageTitle "Euclip"}}
  <AppShell />
  {{outlet}}
</template>
